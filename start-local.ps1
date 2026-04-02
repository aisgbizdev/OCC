param(
  [int]$ApiPort = 8080,
  [int]$WebPort = 18259,
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

function Import-DotEnv {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw ".env file not found at: $Path"
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line) { return }
    if ($line.StartsWith("#")) { return }

    $parts = $line -split "=", 2
    if ($parts.Length -ne 2) { return }

    $name = $parts[0].Trim()
    $value = $parts[1]
    Set-Item -Path ("Env:" + $name) -Value $value
  }
}

function Assert-PortFree {
  param([int]$Port, [string]$Name)

  $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
  if ($listener) {
    $pids = ($listener | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique) -join ", "
    throw "$Name port $Port is already in use by PID(s): $pids"
  }
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $root

Import-DotEnv -Path (Join-Path $root ".env")

if (-not $env:DATABASE_URL) {
  throw "DATABASE_URL is missing. Check .env in project root."
}

if (-not $env:VAPID_PUBLIC_KEY -or -not $env:VAPID_PRIVATE_KEY) {
  Push-Location (Join-Path $root "artifacts\api-server")
  try {
    $keysJson = node -e "console.log(JSON.stringify(require('web-push').generateVAPIDKeys()))"
    $keys = $keysJson | ConvertFrom-Json
    $env:VAPID_EMAIL = if ($env:VAPID_EMAIL) { $env:VAPID_EMAIL } else { "mailto:admin@occ.id" }
    $env:VAPID_PUBLIC_KEY = $keys.publicKey
    $env:VAPID_PRIVATE_KEY = $keys.privateKey
  } finally {
    Pop-Location
  }
}

Assert-PortFree -Port $ApiPort -Name "API"
Assert-PortFree -Port $WebPort -Name "Web"

$backendCmd = "Set-Location '$root'; `$env:PORT='$ApiPort'; `$env:NODE_ENV='development'; pnpm.cmd --filter @workspace/api-server exec tsx ./src/index.ts"
$frontendCmd = "Set-Location '$root\artifacts\occ-web'; `$env:PORT='$WebPort'; `$env:NODE_ENV='development'; pnpm.cmd exec vite --config vite.config.ts --host 0.0.0.0"

$backend = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-NoProfile", "-Command", $backendCmd -PassThru
$frontend = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-NoProfile", "-Command", $frontendCmd -PassThru

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Backend PID : $($backend.Id)"
Write-Host "Frontend PID: $($frontend.Id)"
Write-Host "API URL     : http://localhost:$ApiPort/api/healthz"
Write-Host "WEB URL     : http://localhost:$WebPort"
Write-Host ""
Write-Host "Login cepat:"
Write-Host "email    : superadmin@occ.id"
Write-Host "password : password123"
Write-Host ""

if (-not $NoBrowser) {
  Start-Process "http://localhost:$WebPort" | Out-Null
}
