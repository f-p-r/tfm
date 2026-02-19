<#
Uso rapido:
  powershell -ExecutionPolicy Bypass -File .\deploy-frontend.ps1 -BackendUrl "https://tfmbackend.lawebdeperez.es"

Parametros principales:
  -BackendUrl  (obligatorio) URL base del backend en produccion
  -ReleaseRoot (opcional)   carpeta de salida de releases (por defecto: .\releases)
  -SkipNpmCi   (opcional)   omite npm ci
  -NoHtaccess  (opcional)   no crea .htaccess para fallback SPA

  ! Importante: el archivo .htaccess se genera en UTF-8 sin BOM para evitar errores 500 en hosting.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^https?://')]
  [string]$BackendUrl,

  [string]$ReleaseRoot = '.\\releases',

  [switch]$SkipNpmCi,

  [switch]$NoHtaccess
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptDir

try {
  if (-not (Test-Path 'package.json')) {
    throw 'No se encontro package.json. Ejecuta este script desde la raiz del repositorio frontend.'
  }

  if (-not (Test-Path 'src/environments/environment.ts')) {
    throw 'No se encontro src/environments/environment.ts.'
  }

  foreach ($cmd in @('npm.cmd', 'git')) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
      throw "No se encontro el comando requerido: $cmd"
    }
  }

  $dirty = git status --porcelain
  if ($dirty) {
    Write-Warning 'El arbol de trabajo de Git no esta limpio. Se continua igualmente.'
  }

  if (-not $SkipNpmCi) {
    Write-Host '[1/4] Instalando dependencias (npm ci)...'
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) {
      throw 'Fallo npm ci.'
    }
  }
  else {
    Write-Host '[1/4] Omitiendo npm ci (solicitado).'
  }

  Write-Host '[2/4] Actualizando apiBaseUrl de produccion...'
  $environmentPath = Join-Path $scriptDir 'src/environments/environment.ts'
  $content = Get-Content -Path $environmentPath -Raw
  $pattern = "apiBaseUrl:\s*'[^']*'"

  if ($content -notmatch $pattern) {
    throw 'No se pudo encontrar apiBaseUrl en src/environments/environment.ts'
  }

  $updated = [regex]::Replace($content, $pattern, "apiBaseUrl: '$BackendUrl'", 1)
  Set-Content -Path $environmentPath -Value $updated -NoNewline -Encoding UTF8

  Write-Host '[3/4] Generando build de produccion...'
  & npm.cmd run build -- --configuration production
  if ($LASTEXITCODE -ne 0) {
    throw 'Fallo la build de produccion.'
  }

  $distRoot = Join-Path $scriptDir 'dist'
  if (-not (Test-Path $distRoot)) {
    throw 'No se encontro la carpeta dist tras la build.'
  }

  $indexFile = Get-ChildItem -Path $distRoot -Recurse -File -Filter 'index.html' |
    Where-Object { $_.FullName -match '[\\/]browser[\\/]index\\.html$' } |
    Select-Object -First 1

  if (-not $indexFile) {
    $indexFile = Get-ChildItem -Path $distRoot -Recurse -File -Filter 'index.html' | Select-Object -First 1
  }

  if (-not $indexFile) {
    throw 'No se pudo encontrar index.html en la salida de dist.'
  }

  $buildOutputDir = Split-Path -Parent $indexFile.FullName

  if ([System.IO.Path]::IsPathRooted($ReleaseRoot)) {
    $releaseBase = $ReleaseRoot
  }
  else {
    $releaseBase = Join-Path $scriptDir $ReleaseRoot
  }

  $releaseId = Get-Date -Format 'yyyy-MM-dd_HHmm'
  $releaseDir = Join-Path $releaseBase $releaseId

  Write-Host "[4/4] Creando carpeta de release: $releaseDir"
  New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
  Copy-Item -Path (Join-Path $buildOutputDir '*') -Destination $releaseDir -Recurse -Force

  if (-not $NoHtaccess) {
    $htaccessPath = Join-Path $releaseDir '.htaccess'
    $htaccess = @"
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
"@
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($htaccessPath, $htaccess, $utf8NoBom)
  }

  Write-Host ''
  Write-Host 'Release generada correctamente:'
  Write-Host "  Origen build  : $buildOutputDir"
  Write-Host "  Carpeta release: $releaseDir"
  Write-Host ''
  Write-Host 'Sube el contenido de la carpeta release al document root del subdominio frontend.'
}
finally {
  Pop-Location
}
