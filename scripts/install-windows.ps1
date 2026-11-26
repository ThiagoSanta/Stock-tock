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

# 4. Configurar variables de entorno (.env.local) solo si no existen
$EnvFile = Join-Path $InstallDir ".env.local"
if (-not (Test-Path $EnvFile)) {
    $LocalProjectEnv = "C:\Proyectos\Stock-tock\.env.local"
    if (Test-Path $LocalProjectEnv) {
        Copy-Item $LocalProjectEnv $EnvFile -Force
        Write-Host "[4/5] Configuracion de Supabase copiada automaticamente." -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "Configuracion inicial de Supabase (.env.local):" -ForegroundColor Yellow
        $supaUrl = Read-Host "  Pega tu VITE_SUPABASE_URL"
        $supaKey = Read-Host "  Pega tu VITE_SUPABASE_ANON_KEY"
        @(
            "VITE_SUPABASE_URL=$supaUrl"
            "VITE_SUPABASE_ANON_KEY=$supaKey"
        ) | Set-Content -Path $EnvFile -Encoding UTF8
    }
}

# 5. Instalar dependencias y compilar
Write-Host "[4/5] Instalando dependencias y compilando..." -ForegroundColor Cyan
Push-Location $InstallDir
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "Fallo npm install." }
npm run build
if ($LASTEXITCODE -ne 0) { throw "Fallo npm run build." }
Pop-Location

# 6. Crear lanzador silencioso y un unico acceso directo en el Escritorio
Write-Host "[5/5] Creando acceso directo en el Escritorio..." -ForegroundColor Cyan

$LauncherPs1 = Join-Path $InstallDir "scripts\launch-app.ps1"
$LauncherContent = @"
`$ErrorActionPreference = 'SilentlyContinue'
`$InstallDir = '$InstallDir'
`$Port = $Port
`$AppUrl = '$AppUrl'

function Test-PortReady {
    try {
        `$client = New-Object System.Net.Sockets.TcpClient
        `$iar = `$client.BeginConnect('127.0.0.1', `$Port, `$null, `$null)
        `$ok = `$iar.AsyncWaitHandle.WaitOne(250, `$false)
        if (`$ok -and `$client.Connected) {
            `$client.EndConnect(`$iar)
            `$client.Close()
            return `$true
        }
        `$client.Close()
    } catch {}
    return `$false
}

if (-not (Test-PortReady)) {
    Start-Process -FilePath 'cmd.exe' -ArgumentList "/c cd /d `"`$InstallDir`" && npx vite preview --host 127.0.0.1 --port `$Port --strictPort" -WindowStyle Hidden
    for (`$i = 0; `$i -lt 40; `$i++) {
        if (Test-PortReady) { break }
        Start-Sleep -Milliseconds 300
    }
}

`$edgeCandidates = @(
    "`${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "`$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "`$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
)
`$chromeCandidates = @(
    "`$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "`${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "`$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

`$browser = (`$edgeCandidates + `$chromeCandidates) | Where-Object { Test-Path `$_ } | Select-Object -First 1

if (`$browser) {
    Start-Process -FilePath `$browser -ArgumentList "--app=`$AppUrl", "--new-window"
} else {
    Start-Process `$AppUrl
}
"@
Set-Content -Path $LauncherPs1 -Value $LauncherContent -Encoding UTF8

$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath("Desktop")
$IconPath = Join-Path $InstallDir "public\icons\icon.ico"

# Unico acceso directo principal
$Shortcut = $WshShell.CreateShortcut((Join-Path $Desktop "Stock-tock.lnk"))
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$LauncherPs1`""
$Shortcut.WorkingDirectory = $InstallDir
if (Test-Path $IconPath) { $Shortcut.IconLocation = $IconPath }
$Shortcut.Description = "Abrir Stock-tock (App de Escritorio)"
$Shortcut.Save()

# Limpiar acceso directo secundario si existia de una version anterior
$OldUpdShortcut = Join-Path $Desktop "Actualizar Stock-tock.lnk"
if (Test-Path $OldUpdShortcut) { Remove-Item $OldUpdShortcut -Force }

Write-Host ""
Write-Host "Instalacion finalizada con exito." -ForegroundColor Green
Write-Host "  - Acceso directo en el Escritorio: Stock-tock" -ForegroundColor White
Write-Host "  - Para actualizar en el futuro, volve a correr este mismo comando en PowerShell." -ForegroundColor White
Write-Host ""
