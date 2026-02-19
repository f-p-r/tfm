<#
Uso rapido:
  powershell -ExecutionPolicy Bypass -File .\deploy-frontend.ps1 -BackendUrl "https://tfmbackend.lawebdeperez.es" -CreateZip

Parametros principales:
  -BackendUrl  (obligatorio) URL base del backend en produccion
  -ReleaseRoot (opcional)   carpeta de salida de releases (por defecto: .\releases)
  -CreateZip   (opcional)   genera tambien un .zip de la release
  -SkipNpmCi   (opcional)   omite npm ci
  -NoHtaccess  (opcional)   no crea .htaccess para fallback SPA
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^https?://')]
  [string]$BackendUrl,

  [string]$ReleaseRoot = '.\\releases',

  [switch]$CreateZip,

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
    Write-Host '[1/5] Instalando dependencias (npm ci)...'
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) {
      throw 'Fallo npm ci.'
    }
  }
  else {
    Write-Host '[1/5] Omitiendo npm ci (solicitado).'
  }

  Write-Host '[2/5] Actualizando apiBaseUrl de produccion...'
  $environmentPath = Join-Path $scriptDir 'src/environments/environment.ts'
  $content = Get-Content -Path $environmentPath -Raw
  $pattern = "apiBaseUrl:\s*'[^']*'"

  if ($content -notmatch $pattern) {
    throw 'No se pudo encontrar apiBaseUrl en src/environments/environment.ts'
  }

  $updated = [regex]::Replace($content, $pattern, "apiBaseUrl: '$BackendUrl'", 1)
  Set-Content -Path $environmentPath -Value $updated -NoNewline -Encoding UTF8

  Write-Host '[3/5] Generando build de produccion...'
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

  Write-Host "[4/5] Creando carpeta de release: $releaseDir"
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
    Set-Content -Path $htaccessPath -Value $htaccess -NoNewline -Encoding UTF8
  }

  $zipPath = $null
  if ($CreateZip) {
    Write-Host '[5/5] Creando paquete ZIP...'
    $zipPath = "$releaseDir.zip"
    if (Test-Path $zipPath) {
      Remove-Item -Path $zipPath -Force
    }
    Compress-Archive -Path (Join-Path $releaseDir '*') -DestinationPath $zipPath -Force
  }
  else {
    Write-Host '[5/5] ZIP omitido. Usa -CreateZip para activarlo.'
  }

  Write-Host ''
  Write-Host 'Release generada correctamente:'
  Write-Host "  Origen build  : $buildOutputDir"
  Write-Host "  Carpeta release: $releaseDir"
  if ($zipPath) {
    Write-Host "  Paquete ZIP   : $zipPath"
  }
  Write-Host ''
  Write-Host 'Sube el contenido de la carpeta release al document root del subdominio frontend.'
}
finally {
  Pop-Location
}
