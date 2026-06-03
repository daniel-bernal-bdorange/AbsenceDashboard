param([switch]$Persist)

# fnm (Fast Node Manager) - Activa Node 22 LTS para SPFx
$fnmDir = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Schniz.fnm_Microsoft.Winget.Source_8wekyb3d8bbwe"
$fnmExe = "$fnmDir\fnm.exe"

if (!(Test-Path $fnmExe)) {
    Write-Error "fnm no encontrado en $fnmDir. Instala con: winget install Schniz.fnm"
    exit 1
}

# Añadir fnm al PATH de la sesión si no está
if (-not ($env:Path -like "*$fnmDir*")) {
    $env:Path = "$fnmDir;$env:Path"
}

# Inicializar fnm y usar Node 22
& $fnmExe env | Invoke-Expression
& $fnmExe use 22

$ver = node --version
Write-Host "Node activado: $ver"

# Persistir en perfil PowerShell si se solicita
if ($Persist) {
    try {
        $profilePath = $PROFILE.CurrentUserCurrentHost
        $lines = @(
            '# fnm (Fast Node Manager) - Node 22 para SPFx',
            "`$fnmPath = `"$fnmDir`"",
            'if (Test-Path "$fnmPath\fnm.exe") {',
            '    & "$fnmPath\fnm.exe" env | Invoke-Expression',
            '}'
        )
        $profileDir = Split-Path $profilePath -Parent
        if (-not (Test-Path $profileDir)) {
            New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
        }
        if (Test-Path $profilePath) {
            $content = Get-Content $profilePath -Raw
            if ($content -notmatch 'fnm') {
                Add-Content $profilePath "`n$($lines -join "`n")"
            }
        } else {
            Set-Content $profilePath $($lines -join "`n")
        }
        Write-Host "Perfil PowerShell actualizado: $profilePath"
    } catch {
        Write-Warning "No se pudo actualizar el perfil PowerShell: $_"
    }
}
