param(
  [string]$TestName = "Maestro Test User"
)

$envFile = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $envFile)) {
  throw "Missing $envFile. Add MAESTRO_EMAIL_BASE to apps/app/.env.local."
}

$emailBaseLine = Get-Content $envFile |
  Where-Object { $_ -match "^MAESTRO_EMAIL_BASE=" } |
  Select-Object -First 1
$EmailBase = if ($emailBaseLine) {
  ($emailBaseLine -replace "^MAESTRO_EMAIL_BASE=", "").Trim().Trim('"')
} else {
  ""
}

if (-not $EmailBase) {
  throw "MAESTRO_EMAIL_BASE is missing from $envFile."
}

$passwordLine = Get-Content $envFile |
  Where-Object { $_ -match "^MAESTRO_TEST_PASSWORD=" } |
  Select-Object -First 1
$TestPassword = if ($passwordLine) {
  ($passwordLine -replace "^MAESTRO_TEST_PASSWORD=", "").Trim().Trim('"')
} else {
  ""
}

if (-not $TestPassword) {
  throw "MAESTRO_TEST_PASSWORD is missing from $envFile."
}

$emailParts = $EmailBase -split "@", 2
if ($emailParts.Length -ne 2) {
  throw "EmailBase must be a valid email address."
}

$runId = Get-Date -Format "yyyyMMdd-HHmmssfff"
$testEmail = "$($emailParts[0])+$runId@$($emailParts[1])"
$testName = "$TestName $runId"

$env:MAESTRO_TEST_NAME = $testName
$env:MAESTRO_TEST_EMAIL = $testEmail
$env:MAESTRO_TEST_PASSWORD = $TestPassword

Write-Host "Running Maestro signup with $testEmail"
& maestro test .maestro\signup-verify-and-home.yaml
exit $LASTEXITCODE
