param()

$envFile = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $envFile)) {
  throw "Missing $envFile. Add MAESTRO_TEST_PASSWORD to apps/app/.env.local."
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

$testEmail = "rally.volleyball.maestro+1@gmail.com"
$profileName = "Profile Test Player $(Get-Date -Format 'yyyyMMdd-HHmmss')"
$env:MAESTRO_TEST_EMAIL = $testEmail
$env:MAESTRO_TEST_PASSWORD = $TestPassword
$env:MAESTRO_PROFILE_NAME = $profileName

Write-Host "Running Maestro player profile test with $testEmail"
Write-Host "Using profile name $profileName"
& maestro test .maestro\player-profile.yaml
exit $LASTEXITCODE
