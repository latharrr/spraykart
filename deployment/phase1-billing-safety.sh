#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# SprayKart — Phase 1: AWS Account & Billing Safety
# ═══════════════════════════════════════════════════════════════════════════════
# Run this AFTER:
#   1. Signing in as root and verifying $100 credits in Billing → Credits
#   2. Enabling billing alerts in Billing → Billing preferences
#   3. Enabling IAM access to billing in Account settings
#
# Usage:
#   chmod +x phase1-billing-safety.sh
#   ./phase1-billing-safety.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ┌─────────────────────────────────────────────────────────────────────────────┐
# │  EDIT THESE VALUES BEFORE RUNNING                                          │
# └─────────────────────────────────────────────────────────────────────────────┘
ALERT_EMAIL="your-email@gmail.com"         # ← Your email for billing alerts
IAM_USER="spraykart-ops"                    # ← IAM username (keep default or change)
PROJECT_TAG="spraykart"                     # ← Cost allocation tag value

# ─── Colors for output ────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[✅]${NC} $1"; }
warn()    { echo -e "${YELLOW}[⚠️]${NC} $1"; }
error()   { echo -e "${RED}[❌]${NC} $1"; }

# ─── Pre-flight ───────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  SprayKart — Phase 1: AWS Billing Safety Setup"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ "$ALERT_EMAIL" = "your-email@gmail.com" ]; then
  error "You must edit ALERT_EMAIL at the top of this script before running."
  exit 1
fi

info "Alert email: $ALERT_EMAIL"
info "IAM user:    $IAM_USER"
info "Project tag: $PROJECT_TAG"
echo ""

# Verify AWS CLI is available
if ! command -v aws &> /dev/null; then
  error "AWS CLI is not installed. Install from: https://awscli.amazonaws.com/AWSCLIV2.msi"
  exit 1
fi

info "AWS CLI version: $(aws --version 2>&1 | head -1)"

# Verify credentials
CALLER_ID=$(aws sts get-caller-identity --query 'Arn' --output text 2>/dev/null) || {
  error "AWS credentials not configured. Run 'aws configure' first."
  exit 1
}
info "Authenticated as: $CALLER_ID"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
info "Account ID: $ACCOUNT_ID"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1: Create SNS Topic for Billing Alerts
# ═══════════════════════════════════════════════════════════════════════════════
echo "───────────────────────────────────────────────────────────"
info "Step 1/5: Creating SNS topic for billing alerts..."
echo "───────────────────────────────────────────────────────────"

TOPIC_ARN=$(aws sns create-topic \
  --name spraykart-billing-alerts \
  --region us-east-1 \
  --tags Key=project,Value="$PROJECT_TAG" \
  --query TopicArn \
  --output text 2>/dev/null) || {
  warn "SNS topic may already exist, trying to find it..."
  TOPIC_ARN=$(aws sns list-topics --region us-east-1 \
    --query "Topics[?contains(TopicArn,'spraykart-billing-alerts')].TopicArn" \
    --output text)
}

if [ -z "$TOPIC_ARN" ]; then
  error "Failed to create or find SNS topic"
  exit 1
fi

success "SNS Topic: $TOPIC_ARN"

# Subscribe email
aws sns subscribe \
  --topic-arn "$TOPIC_ARN" \
  --protocol email \
  --notification-endpoint "$ALERT_EMAIL" \
  --region us-east-1 > /dev/null 2>&1

success "Email subscription created for: $ALERT_EMAIL"
warn "CHECK YOUR INBOX NOW — confirm the SNS subscription email!"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: Create 4 Billing Alarms
# ═══════════════════════════════════════════════════════════════════════════════
echo "───────────────────────────────────────────────────────────"
info "Step 2/5: Creating billing alarms at \$20, \$50, \$80, \$95..."
echo "───────────────────────────────────────────────────────────"

for THRESHOLD in 20 50 80 95; do
  aws cloudwatch put-metric-alarm \
    --region us-east-1 \
    --alarm-name "spraykart-billing-${THRESHOLD}usd" \
    --alarm-description "SprayKart: AWS charges have exceeded \$${THRESHOLD}" \
    --namespace AWS/Billing \
    --metric-name EstimatedCharges \
    --dimensions Name=Currency,Value=USD \
    --statistic Maximum \
    --period 21600 \
    --evaluation-periods 1 \
    --threshold "$THRESHOLD" \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --treat-missing-data notBreaching \
    --alarm-actions "$TOPIC_ARN" \
    --tags Key=project,Value="$PROJECT_TAG" 2>/dev/null

  success "Alarm created: spraykart-billing-${THRESHOLD}usd"
done

echo ""

# Verify alarms
info "Verifying alarms..."
aws cloudwatch describe-alarms \
  --region us-east-1 \
  --alarm-name-prefix spraykart-billing \
  --query "MetricAlarms[].{Name:AlarmName,Threshold:Threshold,State:StateValue}" \
  --output table

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: Create Free-Tier Budget Guard
# ═══════════════════════════════════════════════════════════════════════════════
echo "───────────────────────────────────────────────────────────"
info "Step 3/5: Creating free-tier budget guard..."
echo "───────────────────────────────────────────────────────────"

aws budgets create-budget \
  --account-id "$ACCOUNT_ID" \
  --budget "{
    \"BudgetName\": \"spraykart-free-tier-guard\",
    \"BudgetType\": \"COST\",
    \"TimeUnit\": \"MONTHLY\",
    \"BudgetLimit\": {
      \"Amount\": \"1\",
      \"Unit\": \"USD\"
    }
  }" \
  --notifications-with-subscribers "[
    {
      \"Notification\": {
        \"NotificationType\": \"ACTUAL\",
        \"ComparisonOperator\": \"GREATER_THAN\",
        \"Threshold\": 80,
        \"ThresholdType\": \"PERCENTAGE\"
      },
      \"Subscribers\": [
        {
          \"SubscriptionType\": \"EMAIL\",
          \"Address\": \"$ALERT_EMAIL\"
        }
      ]
    }
  ]" \
  --region us-east-1 2>/dev/null && success "Free-tier budget guard created" || warn "Budget may already exist (this is OK if you ran this script before)"

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4: Create IAM User with Least-Privilege Policies
# ═══════════════════════════════════════════════════════════════════════════════
echo "───────────────────────────────────────────────────────────"
info "Step 4/5: Creating IAM user '$IAM_USER'..."
echo "───────────────────────────────────────────────────────────"

# Create user (ignore error if already exists)
aws iam create-user \
  --user-name "$IAM_USER" \
  --tags Key=project,Value="$PROJECT_TAG" 2>/dev/null \
  && success "IAM user '$IAM_USER' created" \
  || warn "IAM user '$IAM_USER' may already exist (continuing...)"

# Attach policies
for POLICY_ARN in \
  "arn:aws:iam::aws:policy/AmazonLightsailFullAccess" \
  "arn:aws:iam::aws:policy/AWSBillingReadOnlyAccess" \
  "arn:aws:iam::aws:policy/CloudWatchFullAccess"; do

  POLICY_NAME=$(echo "$POLICY_ARN" | awk -F'/' '{print $NF}')
  aws iam attach-user-policy \
    --user-name "$IAM_USER" \
    --policy-arn "$POLICY_ARN" 2>/dev/null \
    && success "Attached: $POLICY_NAME" \
    || warn "Policy $POLICY_NAME may already be attached"
done

# Create console login profile
TEMP_PASS="SprayKart-$(date +%s | tail -c 6)#Ops!"
aws iam create-login-profile \
  --user-name "$IAM_USER" \
  --password "$TEMP_PASS" \
  --password-reset-required 2>/dev/null \
  && success "Console login created" \
  || warn "Login profile may already exist (use 'aws iam update-login-profile' to reset)"

# Create access keys
echo ""
info "Creating CLI access keys..."
ACCESS_KEY_OUTPUT=$(aws iam create-access-key \
  --user-name "$IAM_USER" \
  --output json 2>/dev/null) || {
  warn "Could not create access keys (max 2 per user). Delete old keys first if needed."
  ACCESS_KEY_OUTPUT=""
}

if [ -n "$ACCESS_KEY_OUTPUT" ]; then
  AK_ID=$(echo "$ACCESS_KEY_OUTPUT" | grep -o '"AccessKeyId": "[^"]*"' | cut -d'"' -f4)
  AK_SECRET=$(echo "$ACCESS_KEY_OUTPUT" | grep -o '"SecretAccessKey": "[^"]*"' | cut -d'"' -f4)

  echo ""
  echo "┌─────────────────────────────────────────────────────────────┐"
  echo "│              IAM USER CREDENTIALS — SAVE THESE!            │"
  echo "├─────────────────────────────────────────────────────────────┤"
  echo "│  Console URL:  https://${ACCOUNT_ID}.signin.aws.amazon.com/console"
  echo "│  Username:     $IAM_USER"
  echo "│  Temp Pass:    $TEMP_PASS"
  echo "│  Access Key:   $AK_ID"
  echo "│  Secret Key:   $AK_SECRET"
  echo "├─────────────────────────────────────────────────────────────┤"
  echo "│  ⚠️  Secret key is shown ONLY ONCE. Save it NOW.          │"
  echo "│  📋 Store in a password manager (Bitwarden, 1Password)     │"
  echo "└─────────────────────────────────────────────────────────────┘"
  echo ""

  success "Access keys created"
else
  warn "Skipped access key creation"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5: Summary & Next Steps
# ═══════════════════════════════════════════════════════════════════════════════
echo "───────────────────────────────────────────────────────────"
info "Step 5/5: Verification summary"
echo "───────────────────────────────────────────────────────────"
echo ""

# List attached policies
info "Policies attached to $IAM_USER:"
aws iam list-attached-user-policies \
  --user-name "$IAM_USER" \
  --query "AttachedPolicies[].PolicyName" \
  --output table 2>/dev/null || warn "Could not list policies"

echo ""

# List alarms
info "Billing alarms:"
aws cloudwatch describe-alarms \
  --region us-east-1 \
  --alarm-name-prefix spraykart-billing \
  --query "MetricAlarms[].AlarmName" \
  --output table 2>/dev/null || warn "Could not list alarms"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Phase 1 Complete — Manual Steps Remaining:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  1. ✅ Confirm SNS subscription from your email inbox"
echo "  2. 🔐 Enable MFA on ROOT account (Console → Security credentials)"
echo "  3. 🔐 Enable MFA on $IAM_USER (Log in as IAM → Security credentials)"
echo "  4. 🗑️  Delete root access keys (Console → Security credentials)"
echo "  5. 🏷️  Activate 'project' cost allocation tag (Billing → Cost allocation tags)"
echo "  6. 🔄 Switch CLI to IAM profile:"
echo "     aws configure --profile spraykart"
echo "     export AWS_PROFILE=spraykart  # or \$env:AWS_PROFILE='spraykart' on PowerShell"
echo ""
echo "  When all done, reply 'Phase 1 done' to proceed to Phase 2."
echo ""
