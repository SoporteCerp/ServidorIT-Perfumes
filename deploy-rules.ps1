<#
  Despliega las reglas de Firestore (y opcionalmente Storage) de Esencia Gale.
  Uso:  .\deploy-rules.ps1   (desde la raiz del proyecto)
  Requiere: Node.js y Firebase CLI instalados
            (npm install -g firebase-tools)
#>
$ErrorActionPreference = 'Stop'
$projectId = 'soportecerp-9643d'
$root = $PSScriptRoot

if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
  Write-Host '[ERROR] No se encontro "firebase" en PATH.' -ForegroundColor Red
  Write-Host '        Instala el CLI:  npm install -g firebase-tools' -ForegroundColor Yellow
  exit 1
}

# 1) firebase.json (si no existe) -> indica que reglas desplegar
$firebaseJson = Join-Path $root 'firebase.json'
if (-not (Test-Path -LiteralPath $firebaseJson)) {
  $json = @'
{
  "firestore": { "rules": "firestore.rules" },
  "storage": { "rules": "storage.rules" }
}
'@
  [System.IO.File]::WriteAllText($firebaseJson, $json, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host '[OK] firebase.json creado' -ForegroundColor Green
} else {
  Write-Host '[OK] firebase.json ya existe' -ForegroundColor Green
}

# 2) .firebaserc (si no existe) -> fija el proyecto por defecto
$rcPath = Join-Path $root '.firebaserc'
if (-not (Test-Path -LiteralPath $rcPath)) {
  $rcJson = @"
{
  "projects": { "default": "$projectId" }
}
"@
  [System.IO.File]::WriteAllText($rcPath, $rcJson, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host '[OK] .firebaserc creado' -ForegroundColor Green
} else {
  Write-Host '[OK] .firebaserc ya existe' -ForegroundColor Green
}

# 3) Login (si ya hay sesion, no hace nada)
Write-Host ''
Write-Host '==> firebase login (solo se abrira el navegador si no tienes sesion)...' -ForegroundColor Cyan
& firebase login
if ($LASTEXITCODE -ne 0) {
  Write-Host '[ERROR] Fallo el login.' -ForegroundColor Red
  exit 1
}

# 4) Desplegar reglas de Firestore
Write-Host ''
Write-Host '==> Desplegando reglas de Firestore...' -ForegroundColor Cyan
& firebase deploy --only firestore:rules --project $projectId
if ($LASTEXITCODE -ne 0) {
  Write-Host '[ERROR] No se pudieron desplegar firestore.rules' -ForegroundColor Red
  exit 1
}
Write-Host '[OK] firestore.rules desplegadas' -ForegroundColor Green

# 5) Opcional: Storage (podria requerir upgrade a Blaze)
$choice = Read-Host "Desplegar tambien storage.rules? (s/N)"
if ($choice -eq '' -or $choice -match '^[sS]') {
  Write-Host ''
  Write-Host '==> Desplegando reglas de Storage...' -ForegroundColor Cyan
  & firebase deploy --only storage --project $projectId
  if ($LASTEXITCODE -ne 0) {
    Write-Host '[AVISO] storage.rules no se desplego.' -ForegroundColor Yellow
    Write-Host '        Si el proyecto es Spark, activa Cloud Storage y has upgrade a Blaze' -ForegroundColor Yellow
    Write-Host '        en Firebase Console > Proyecto > Uso y facturacion.' -ForegroundColor Yellow
  } else {
    Write-Host '[OK] storage.rules desplegadas' -ForegroundColor Green
  }
}

Write-Host ''
Write-Host 'Listo. Siguiente paso: avisame para ejecutar la migracion de users a keyed-by-uid.' -ForegroundColor Cyan