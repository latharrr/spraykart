# SprayKart Phase 1: AWS Account and Billing Safety (PowerShell)
# Run after: enabling billing alerts in console, enabling IAM billing access

$ErrorActionPreference = "Continue"

$ALERT_EMAIL = "deepanshulathar@gmail.com"
$IAM_USER    = "spraykart-ops"
$PROJECT_TAG = "spraykart"

Write-Host ""
Write-Host "SprayKart Phase 1: AWS Billing Safety Setup" -ForegroundColor Cyan
Write-Host ""

# Pre-flight
$awsVer = aws --version 2>&1
if ($LASTEXITCODE -ne 0) { Write-Host "[ERR] AWS CLI not installed" -ForegroundColor Red; exit 1 }
Write-Host "[INFO] $awsVer" -ForegroundColor Gray

$ACCOUNT_ID = aws sts get-caller-identity --query "Account" --output text 2>&1
if ($LASTEXITCODE -ne 0) { Write-Host "[ERR] Not authenticated. Run aws configure first." -ForegroundColor Red; exit 1 }
Write-Host "[INFO] Account: $ACCOUNT_ID" -ForegroundColor Gray
Write-Host ""

# ── STEP 1: SNS Topic ────────────────────────────────────────────────────────
Write-Host "[STEP 1/5] Creating SNS topic..." -ForegroundColor Cyan

$TOPIC_ARN = aws sns create-topic --name spraykart-billing-alerts --region us-east-1 --tags Key=project,Value=$PROJECT_TAG --query "TopicArn" --output text 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] Topic may exist, searching..." -ForegroundColor Yellow
    $topicsJson = aws sns list-topics --region us-east-1 --output json 2>&1
    $topicsObj = $topicsJson | ConvertFrom-Json
    $TOPIC_ARN = ($topicsObj.Topics | Where-Object { $_.TopicArn -like "*spraykart-billing*" }).TopicArn
}
if (-not $TOPIC_ARN) { Write-Host "[ERR] Cannot find or create SNS topic" -ForegroundColor Red; exit 1 }
Write-Host "[OK] Topic: $TOPIC_ARN" -ForegroundColor Green

aws sns subscribe --topic-arn $TOPIC_ARN --protocol email --notification-endpoint $ALERT_EMAIL --region us-east-1 --output text 2>&1 | Out-Null
Write-Host "[OK] Subscribed: $ALERT_EMAIL" -ForegroundColor Green
Write-Host "[WARN] Confirm the email in your inbox (check spam)" -ForegroundColor Yellow
Write-Host ""

# ── STEP 2: Billing Alarms ───────────────────────────────────────────────────
Write-Host "[STEP 2/5] Creating billing alarms..." -ForegroundColor Cyan

foreach ($t in @(20, 50, 80, 95)) {
    aws cloudwatch put-metric-alarm --region us-east-1 --alarm-name "spraykart-billing-${t}usd" --alarm-description "SprayKart charges exceeded ${t} USD" --namespace "AWS/Billing" --metric-name "EstimatedCharges" --dimensions "Name=Currency,Value=USD" --statistic "Maximum" --period 21600 --evaluation-periods 1 --threshold $t --comparison-operator "GreaterThanOrEqualToThreshold" --treat-missing-data "notBreaching" --alarm-actions $TOPIC_ARN --tags Key=project,Value=$PROJECT_TAG 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Alarm: spraykart-billing-${t}usd" -ForegroundColor Green
    }
    else {
        Write-Host "[WARN] Failed alarm ${t}usd - check permissions" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "[INFO] Verifying alarms:" -ForegroundColor Gray
aws cloudwatch describe-alarms --region us-east-1 --alarm-name-prefix "spraykart-billing" --query "MetricAlarms[].AlarmName" --output table
Write-Host ""

# ── STEP 3: Budget ────────────────────────────────────────────────────────────
Write-Host "[STEP 3/5] Creating budget (also earns credit activity)..." -ForegroundColor Cyan

$budgetPath = Join-Path -Path $env:TEMP -ChildPath "sk-budget.json"
$notifPath  = Join-Path -Path $env:TEMP -ChildPath "sk-notif.json"

@'
{
  "BudgetName": "spraykart-free-tier-guard",
  "BudgetType": "COST",
  "TimeUnit": "MONTHLY",
  "BudgetLimit": {"Amount": "1", "Unit": "USD"}
}
'@ | Set-Content -Path $budgetPath -Encoding UTF8

@'
[{"Notification": {"NotificationType": "ACTUAL", "ComparisonOperator": "GREATER_THAN", "Threshold": 80, "ThresholdType": "PERCENTAGE"}, "Subscribers": [{"SubscriptionType": "EMAIL", "Address": "PLACEHOLDER"}]}]
'@ -replace 'PLACEHOLDER', $ALERT_EMAIL | Set-Content -Path $notifPath -Encoding UTF8

$budgetRes = aws budgets create-budget --account-id $ACCOUNT_ID --budget "file://$budgetPath" --notifications-with-subscribers "file://$notifPath" --region us-east-1 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Budget created (counts as Explore AWS activity!)" -ForegroundColor Green
}
else {
    if ("$budgetRes" -like "*Duplicate*") {
        Write-Host "[WARN] Budget already exists (OK)" -ForegroundColor Yellow
    }
    else {
        Write-Host "[WARN] Budget result: $budgetRes" -ForegroundColor Yellow
    }
}

Remove-Item -Path $budgetPath -ErrorAction SilentlyContinue
Remove-Item -Path $notifPath -ErrorAction SilentlyContinue
Write-Host ""

# ── STEP 4: IAM User ─────────────────────────────────────────────────────────
Write-Host "[STEP 4/5] Creating IAM user..." -ForegroundColor Cyan

aws iam create-user --user-name $IAM_USER --tags Key=project,Value=$PROJECT_TAG 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] User $IAM_USER created" -ForegroundColor Green
}
else {
    Write-Host "[WARN] User may already exist" -ForegroundColor Yellow
}

$policyArns = @(
    "arn:aws:iam::aws:policy/AmazonLightsailFullAccess"
    "arn:aws:iam::aws:policy/AWSBillingReadOnlyAccess"
    "arn:aws:iam::aws:policy/CloudWatchFullAccess"
)
foreach ($p in $policyArns) {
    $pName = $p.Split("/")[-1]
    aws iam attach-user-policy --user-name $IAM_USER --policy-arn $p 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Host "[OK] Attached: $pName" -ForegroundColor Green }
    else { Write-Host "[WARN] $pName may be attached already" -ForegroundColor Yellow }
}

$ts = Get-Date -Format "HHmmss"
$TEMP_PASS = "SprayKart${ts}Ops"

$loginRes = aws iam create-login-profile --user-name $IAM_USER --password $TEMP_PASS --password-reset-required 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Console login created" -ForegroundColor Green
}
else {
    Write-Host "[WARN] Login profile may already exist" -ForegroundColor Yellow
    $TEMP_PASS = "(use existing password)"
}

Write-Host ""
Write-Host "[INFO] Creating access keys..." -ForegroundColor Gray
$keyJson = aws iam create-access-key --user-name $IAM_USER --output json 2>&1
if ($LASTEXITCODE -eq 0) {
    $keyObj = $keyJson | ConvertFrom-Json
    $akId = $keyObj.AccessKey.AccessKeyId
    $akSecret = $keyObj.AccessKey.SecretAccessKey
    Write-Host ""
    Write-Host "  IAM CREDENTIALS (save these now!):" -ForegroundColor Yellow
    Write-Host "  Console: https://$ACCOUNT_ID.signin.aws.amazon.com/console" -ForegroundColor White
    Write-Host "  User:    $IAM_USER" -ForegroundColor White
    Write-Host "  Pass:    $TEMP_PASS" -ForegroundColor White
    Write-Host "  Key ID:  $akId" -ForegroundColor White
    Write-Host "  Secret:  $akSecret" -ForegroundColor White
    Write-Host "  ** Secret shown ONLY ONCE **" -ForegroundColor Red
    Write-Host ""
}
else {
    Write-Host "[WARN] Could not create access keys (max 2 per user)" -ForegroundColor Yellow
}

# ── STEP 5: Summary ──────────────────────────────────────────────────────────
Write-Host "[STEP 5/5] Summary" -ForegroundColor Cyan
Write-Host ""

Write-Host "[INFO] Attached policies:" -ForegroundColor Gray
aws iam list-attached-user-policies --user-name $IAM_USER --query "AttachedPolicies[].PolicyName" --output table

Write-Host ""
Write-Host "Phase 1 CLI steps complete." -ForegroundColor Green
Write-Host ""
Write-Host "Manual steps remaining:" -ForegroundColor White
Write-Host "  1. Confirm SNS email in inbox" -ForegroundColor White
Write-Host "  2. Enable MFA on root (Console, Security credentials)" -ForegroundColor White
Write-Host "  3. Enable MFA on $IAM_USER" -ForegroundColor White
Write-Host "  4. Delete root access keys" -ForegroundColor White
Write-Host "  5. Activate project tag (Billing, Cost allocation tags)" -ForegroundColor White
Write-Host "  6. Switch CLI profile:" -ForegroundColor White
Write-Host '     aws configure --profile spraykart' -ForegroundColor Cyan
Write-Host '     $env:AWS_PROFILE = "spraykart"' -ForegroundColor Cyan
Write-Host ""
Write-Host "CREDIT NOTE: Your 100 USD comes from 5 activities (20 each)." -ForegroundColor Yellow
Write-Host "Budget creation (done above) = 1/5 complete." -ForegroundColor Yellow
Write-Host "We will handle the other 4 in subsequent phases." -ForegroundColor Yellow
Write-Host ""
