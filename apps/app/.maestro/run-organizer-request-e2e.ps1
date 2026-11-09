# Copyright (c) 2026 Rally. All rights reserved.
# AI contribution: 50% or more AI-generated

param()

$envFile = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $envFile)) {
  throw "Missing $envFile. Add MAESTRO_EMAIL_BASE and MAESTRO_TEST_PASSWORD."
}

$passwordLine = Get-Content $envFile |
  Where-Object { $_ -match "^MAESTRO_TEST_PASSWORD=" } |
  Select-Object -First 1
$testPassword = if ($passwordLine) {
  ($passwordLine -replace "^MAESTRO_TEST_PASSWORD=", "").Trim().Trim('"')
} else {
  ""
}

$emailLine = Get-Content $envFile |
  Where-Object { $_ -match "^MAESTRO_EMAIL_BASE=" } |
  Select-Object -First 1
$emailBase = if ($emailLine) {
  ($emailLine -replace "^MAESTRO_EMAIL_BASE=", "").Trim().Trim('"')
} else {
  ""
}

if (-not $testPassword) {
  throw "MAESTRO_TEST_PASSWORD is required."
}
if (-not $emailBase) {
  throw "MAESTRO_EMAIL_BASE is required."
}

$emailParts = $emailBase -split "@", 2
if ($emailParts.Length -ne 2) {
  throw "MAESTRO_EMAIL_BASE must be a valid email address."
}

$runId = Get-Date -Format "yyyyMMdd-HHmmssfff"
$testEmail = "$($emailParts[0])+organizer-$runId@$($emailParts[1])"
$env:MAESTRO_TEST_NAME = "Organizer Request Test $runId"

$env:MAESTRO_TEST_EMAIL = $testEmail
$env:MAESTRO_TEST_PASSWORD = $testPassword
$env:MAESTRO_ORGANIZER_DESCRIPTION = "Weekly 6v6 community tournaments in Verdun."
$env:MAESTRO_ORGANIZER_LINK = "https://instagram.com/rally.maestro.test"

Write-Host "Running Maestro organizer application flow with $testEmail"
& maestro test .maestro\organizer-request.yaml
exit $LASTEXITCODE
