# SprayKart Phase 2: Lightsail Instance Provisioning
# Run this from your local Windows terminal

$ErrorActionPreference = "Continue"

# Try to find aws.exe
$awsExe = "aws"
if (Test-Path "C:\Program Files\Amazon\AWSCLIV2\aws.exe") {
    $awsExe = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
}

$INSTANCE_NAME = "spraykart-prod"
# micro_3_1 = $7/mo, 1GB RAM, 2vCPU — only tier allowed on new AWS accounts in ap-south-1
# We will configure 2GB swap on the server to compensate
$BUNDLE_ID     = "micro_3_1"        
$BLUEPRINT_ID  = "ubuntu_22_04"     
$AZ            = "ap-south-1a"      
$REGION        = "ap-south-1"       
$KEY_NAME      = "spraykart-key"
$PROJECT_TAG   = "spraykart"

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "  SprayKart Phase 2: Provisioning Lightsail" -ForegroundColor Cyan
Write-Host "=======================================================`n" -ForegroundColor Cyan

# 1. Create SSH Key
Write-Host "[1/5] Creating SSH Key Pair ($KEY_NAME)..." -ForegroundColor Yellow
$keyPath = Join-Path -Path $env:USERPROFILE -ChildPath ".ssh\spraykart_lightsail.pem"
$sshDir = Join-Path -Path $env:USERPROFILE -ChildPath ".ssh"
if (-not (Test-Path $sshDir)) { New-Item -ItemType Directory -Force -Path $sshDir | Out-Null }

if (Test-Path $keyPath) {
    Write-Host "[INFO] Key already exists locally at $keyPath. Using existing key." -ForegroundColor Gray
} else {
    $keyOutput = & $awsExe lightsail create-key-pair --key-pair-name $KEY_NAME --tags key=project,value=$PROJECT_TAG --output json 2>&1
    if ($LASTEXITCODE -eq 0) {
        $keyJson = $keyOutput | ConvertFrom-Json
        $privateKey = $keyJson.privateKeyBase64
        Set-Content -Path $keyPath -Value $privateKey -Encoding ascii
        $icacls = "$env:windir\System32\icacls.exe"
        & $icacls $keyPath /inheritance:r /grant:r "$($env:USERNAME):R" | Out-Null
        Write-Host "[OK] Key saved to $keyPath" -ForegroundColor Green
    } else {
        if ("$keyOutput" -like "*already exists*") {
            Write-Host "[WARN] Key name exists in AWS but not locally. Deleting from AWS to recreate..." -ForegroundColor Yellow
            & $awsExe lightsail delete-key-pair --key-pair-name $KEY_NAME | Out-Null
            $keyOutput = & $awsExe lightsail create-key-pair --key-pair-name $KEY_NAME --tags key=project,value=$PROJECT_TAG --output json
            $keyJson = $keyOutput | ConvertFrom-Json
            $privateKey = $keyJson.privateKeyBase64
            Set-Content -Path $keyPath -Value $privateKey -Encoding ascii
            $icacls = "$env:windir\System32\icacls.exe"
            & $icacls $keyPath /inheritance:r /grant:r "$($env:USERNAME):R" | Out-Null
            Write-Host "[OK] Key recreated and saved to $keyPath" -ForegroundColor Green
        } else {
            Write-Host "[ERR] Failed to create key: $keyOutput" -ForegroundColor Red
            exit 1
        }
    }
}

# 2. Create Instance
Write-Host "`n[2/5] Creating Lightsail Instance ($INSTANCE_NAME)..." -ForegroundColor Yellow
$instanceOutput = & $awsExe lightsail get-instance --region $REGION --instance-name $INSTANCE_NAME 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[INFO] Instance already exists. Skipping creation." -ForegroundColor Gray
} else {
    $createOutput = & $awsExe lightsail create-instances --region $REGION --instance-names $INSTANCE_NAME --availability-zone $AZ --blueprint-id $BLUEPRINT_ID --bundle-id $BUNDLE_ID --key-pair-name $KEY_NAME --tags key=project,value=$PROJECT_TAG 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERR] Failed to create instance: $createOutput" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Instance provisioning started (micro_3_1: 1GB RAM, 2vCPU, 40GB SSD)." -ForegroundColor Green
    Write-Host "Waiting 30 seconds for instance to initialize..." -ForegroundColor Gray
    Start-Sleep -Seconds 30
}

# 3. Create Static IP
$STATIC_IP_NAME = "spraykart-static-ip"
Write-Host "`n[3/5] Allocating Static IP ($STATIC_IP_NAME)..." -ForegroundColor Yellow
$ipOutput = & $awsExe lightsail get-static-ip --region $REGION --static-ip-name $STATIC_IP_NAME 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[INFO] Static IP already allocated." -ForegroundColor Gray
} else {
    & $awsExe lightsail allocate-static-ip --region $REGION --static-ip-name $STATIC_IP_NAME | Out-Null
    Write-Host "[OK] Static IP allocated." -ForegroundColor Green
    Start-Sleep -Seconds 5
}

# 4. Attach Static IP
Write-Host "`n[4/5] Attaching Static IP to Instance..." -ForegroundColor Yellow
$ipDetailsStr = & $awsExe lightsail get-static-ip --region $REGION --static-ip-name $STATIC_IP_NAME --output json 2>&1
if ($LASTEXITCODE -eq 0) {
    $ipDetails = $ipDetailsStr | ConvertFrom-Json
    if ($ipDetails.staticIp.isAttached) {
        Write-Host "[INFO] Static IP is already attached to $($ipDetails.staticIp.attachedTo)." -ForegroundColor Gray
    } else {
        & $awsExe lightsail attach-static-ip --region $REGION --static-ip-name $STATIC_IP_NAME --instance-name $INSTANCE_NAME | Out-Null
        Write-Host "[OK] Static IP attached." -ForegroundColor Green
    }
} else {
    Write-Host "[ERR] Failed to get static IP details." -ForegroundColor Red
}

# 5. Configure Firewall
Write-Host "`n[5/5] Configuring Firewall (Ports 22, 80, 443)..." -ForegroundColor Yellow

$portPath = Join-Path -Path $env:TEMP -ChildPath "ports.json"
@'
[
  {"protocol": "tcp", "fromPort": 22, "toPort": 22},
  {"protocol": "tcp", "fromPort": 80, "toPort": 80},
  {"protocol": "tcp", "fromPort": 443, "toPort": 443}
]
'@ | Set-Content -Path $portPath -Encoding UTF8

& $awsExe lightsail put-instance-public-ports --region $REGION --instance-name $INSTANCE_NAME --port-infos "file://$portPath" | Out-Null
Remove-Item -Path $portPath -ErrorAction SilentlyContinue
Write-Host "[OK] Firewall locked down to Web & SSH only." -ForegroundColor Green

# Final Verification
Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "  Phase 2 Complete!" -ForegroundColor Green
Write-Host "=======================================================`n" -ForegroundColor Cyan

$finalIp = & $awsExe lightsail get-static-ip --region $REGION --static-ip-name $STATIC_IP_NAME --query "staticIp.ipAddress" --output text
Write-Host "Your Public IP Address is: $finalIp" -ForegroundColor Magenta
Write-Host "Your SSH Key is saved at:  $keyPath" -ForegroundColor Magenta

Write-Host "`nTo connect to your server, run this command:" -ForegroundColor White
Write-Host "ssh -i ""$keyPath"" ubuntu@$finalIp" -ForegroundColor Cyan
Write-Host ""
