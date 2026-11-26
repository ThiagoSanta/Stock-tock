# Instalador / Actualizador Local de Stock-tock para Windows (sin .exe, sin SmartScreen, sin Admin)
# Uso desde PowerShell:
#   irm https://raw.githubusercontent.com/ThiagoSanta/Stock-tock/main/scripts/install-windows.ps1 | iex

$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/ThiagoSanta/Stock-tock.git"
$InstallDir = Join-Path $env:LOCALAPPDATA "Stock-tock"
$Port = 4173
$AppUrl = "http://localhost:$Port"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "   Stock-tock | Instalador Local (Windows)   " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

function Refresh-Path {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("Path", "User")
}

# 1. Verificar Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[1/5] Instalando Git..." -ForegroundColor Yellow
    winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
    Refresh-Path
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "No se pudo detectar Git tras instalar. Cerra y volve a abrir PowerShell e intenta de nuevo."
    }
} else {
    Write-Host "[1/5] Git detectado." -ForegroundColor Gray
}

# 2. Verificar Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[2/5] Instalando Node.js LTS..." -ForegroundColor Yellow
    winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements
    Refresh-Path
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw "No se pudo detectar Node.js tras instalar. Cerra y volve a abrir PowerShell e intenta de nuevo."
    }
} else {
    Write-Host "[2/5] Node.js detectado ($(node -v))." -ForegroundColor Gray
}

# 3. Clonar o actualizar repositorio
if (Test-Path (Join-Path $InstallDir ".git")) {
    Write-Host "[3/5] Actualizando Stock-tock en $InstallDir..." -ForegroundColor Cyan
    Push-Location $InstallDir
    git pull origin main
    Pop-Location
} else {
    Write-Host "[3/5] Descargando Stock-tock en $InstallDir..." -ForegroundColor Cyan
    if (Test-Path $InstallDir) { Remove-Item -Recurse -Force $InstallDir }
    git clone $RepoUrl $InstallDir
}

# 4. Configurar variables de entorno (.env.local) si no existen
$EnvFile = Join-Path $InstallDir ".env.local"
if (-not (Test-Path $EnvFile)) {
    Write-Host ""
    Write-Host "Configuracion inicial de Supabase (.env.local):" -ForegroundColor Yellow
    $supaUrl = Read-Host "  Pega tu VITE_SUPABASE_URL (Enter para omitir y editar luego)"
    $supaKey = Read-Host "  Pega tu VITE_SUPABASE_ANON_KEY (Enter para omitir y editar luego)"
    @(
        "VITE_SUPABASE_URL=$supaUrl"
        "VITE_SUPABASE_ANON_KEY=$supaKey"
    ) | Set-Content -Path $EnvFile -Encoding UTF8
}

# 5. Instalar dependencias y compilar
Write-Host "[4/5] Instalando dependencias y compilando..." -ForegroundColor Cyan
Push-Location $InstallDir
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "Fallo npm install." }
npm run build
if ($LASTEXITCODE -ne 0) { throw "Fallo npm run build." }
Pop-Location

# 6. Crear lanzador silencioso y accesos directos en el Escritorio
Write-Host "[5/5] Creando accesos directos en el Escritorio..." -ForegroundColor Cyan

$LauncherPs1 = Join-Path $InstallDir "scripts\launch-app.ps1"
$LauncherContent = @"
`$ErrorActionPreference = 'SilentlyContinue'
`$InstallDir = '$InstallDir'
`$Port = $Port
`$AppUrl = '$AppUrl'

# Si el puerto no esta escuchando, iniciar vite preview en segundo plano sin ventana
`$listening = Get-NetTCPConnection -LocalPort `$Port -State Listen -ErrorAction SilentlyContinue
if (-not `$listening) {
    Start-Process -FilePath 'cmd.exe' -ArgumentList "/c cd /d `"`$InstallDir`" && npx vite preview --port `$Port --strictPort" -WindowStyle Hidden
    Start-Sleep -Seconds 2
}

# Abrir en modo ventana de aplicacion con Edge o Chrome
`$edge = "`$env:ProgramFiles (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path `$edge)) { `$edge = "`$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" }
`$chrome = "`$env:ProgramFiles\Google\Chrome\Application\chrome.exe"

if (Test-Path `$edge) {
    Start-Process -FilePath `$edge -ArgumentList "--app=`$AppUrl"
} elseif (Test-Path `$chrome) {
    Start-Process -FilePath `$chrome -ArgumentList "--app=`$AppUrl"
} else {
    Start-Process `$AppUrl
}
"@
Set-Content -Path $LauncherPs1 -Value $LauncherContent -Encoding UTF8

$UpdaterBat = Join-Path $InstallDir "scripts\update-app.bat"
$UpdaterContent = @"
@echo off
title Actualizar Stock-tock
cd /d "$InstallDir"
echo Actualizando Stock-tock desde GitHub...
git pull origin main
call npm install --no-audit --no-fund
call npm run build
echo.
echo Actualizacion completa. Ya podes abrir Stock-tock.
pause
"@
Set-Content -Path $UpdaterBat -Value $UpdaterContent -Encoding ASCII

$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath("Desktop")
$IconPath = Join-Path $InstallDir "public\icons\icon.ico"

# Acceso directo principal
$Shortcut = $WshShell.CreateShortcut((Join-Path $Desktop "Stock-tock.lnk"))
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$LauncherPs1`""
$Shortcut.WorkingDirectory = $InstallDir
if (Test-Path $IconPath) { $Shortcut.IconLocation = $IconPath }
$Shortcut.Description = "Abrir Stock-tock (Modo App Local)"
$Shortcut.Save()

# Acceso directo de actualizacion
$UpdShortcut = $WshShell.CreateShortcut((Join-Path $Desktop "Actualizar Stock-tock.lnk"))
$UpdShortcut.TargetPath = $UpdaterBat
$UpdShortcut.WorkingDirectory = $InstallDir
if (Test-Path $IconPath) { $UpdShortcut.IconLocation = $IconPath }
$UpdShortcut.Description = "Actualizar Stock-tock a la ultima version"
$UpdShortcut.Save()

Write-Host ""
Write-Host "Instalacion finalizada con exito." -ForegroundColor Green
Write-Host "  - Acceso directo creado en el Escritorio: Stock-tock" -ForegroundColor White
Write-Host "  - Para actualizar en el futuro: doble clic en 'Actualizar Stock-tock' o volve a correr este comando." -ForegroundColor White
Write-Host ""
