#!/bin/bash
# ─── Step 1: Create RDS PostgreSQL (Free Tier) ─────────────────────────────
# Run this from your LOCAL machine with AWS CLI configured.
# Prerequisites:
#   - aws cli installed & configured (aws configure)
#   - Your Lightsail instance security group / VPC info

set -euo pipefail

# ── CONFIG — edit these ──────────────────────────────────────────────────────
DB_INSTANCE_ID="spraykart-db"
DB_NAME="spraykart"
DB_USER="spraykart_user"
DB_PASSWORD="Spraykart@2026"   # ← change before running
REGION="ap-south-1"                          # Mumbai — same as Lightsail
# ─────────────────────────────────────────────────────────────────────────────

echo ">>> Creating RDS subnet group..."

# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault,Values=true" \
  --query "Vpcs[0].VpcId" \
  --output text \
  --region "$REGION")

echo "Using VPC: $VPC_ID"

# Get subnets in that VPC
SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query "Subnets[*].SubnetId" \
  --output text \
  --region "$REGION" | tr '\t' ',')

echo "Using subnets: $SUBNET_IDS"

# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name "spraykart-subnet-group" \
  --db-subnet-group-description "Spraykart RDS subnet group" \
  --subnet-ids $(echo $SUBNET_IDS | tr ',' ' ') \
  --region "$REGION" || echo "Subnet group may already exist, continuing..."

echo ">>> Creating RDS security group..."

# Create security group for RDS
SG_ID=$(aws ec2 create-security-group \
  --group-name "spraykart-rds-sg" \
  --description "Spraykart RDS security group" \
  --vpc-id "$VPC_ID" \
  --region "$REGION" \
  --query "GroupId" \
  --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=spraykart-rds-sg" \
    --query "SecurityGroups[0].GroupId" \
    --output text \
    --region "$REGION")

echo "Security Group: $SG_ID"

# Allow PostgreSQL port 5432 ONLY from your Lightsail instance IP
# Replace with your actual Lightsail static IP
LIGHTSAIL_IP="65.0.239.246"

aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp \
  --port 5432 \
  --cidr "${LIGHTSAIL_IP}/32" \
  --region "$REGION" 2>/dev/null || echo "Ingress rule may already exist, continuing..."

echo ">>> Creating RDS instance (FREE TIER: db.t2.micro, 20GB)..."

aws rds create-db-instance \
  --db-instance-identifier "$DB_INSTANCE_ID" \
  --db-instance-class "db.t2.micro" \
  --engine "postgres" \
  --engine-version "16.3" \
  --master-username "$DB_USER" \
  --master-user-password "$DB_PASSWORD" \
  --db-name "$DB_NAME" \
  --allocated-storage 20 \
  --storage-type gp2 \
  --no-multi-az \
  --no-publicly-accessible \
  --vpc-security-group-ids "$SG_ID" \
  --db-subnet-group-name "spraykart-subnet-group" \
  --backup-retention-period 7 \
  --preferred-backup-window "02:00-03:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --storage-encrypted \
  --deletion-protection \
  --region "$REGION"

echo ""
echo ">>> RDS instance is being created. This takes ~5-10 minutes."
echo ">>> Run this to check status:"
echo ""
echo "    aws rds describe-db-instances \\"
echo "      --db-instance-identifier $DB_INSTANCE_ID \\"
echo "      --query 'DBInstances[0].DBInstanceStatus' \\"
echo "      --output text \\"
echo "      --region $REGION"
echo ""
echo ">>> Once status is 'available', get the endpoint:"
echo ""
echo "    aws rds describe-db-instances \\"
echo "      --db-instance-identifier $DB_INSTANCE_ID \\"
echo "      --query 'DBInstances[0].Endpoint.Address' \\"
echo "      --output text \\"
echo "      --region $REGION"
echo ""
echo ">>> Your DATABASE_URL will be:"
echo "    postgresql://${DB_USER}:${DB_PASSWORD}@<ENDPOINT>:5432/${DB_NAME}?sslmode=require"
