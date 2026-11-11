$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  $runtimeRoot = Join-Path $env:USERPROFILE '.codex\runtimes'
  $portableNode = Get-ChildItem -LiteralPath $runtimeRoot -Filter node.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $portableNode) { throw 'Instale Node.js 22 LTS e execute novamente.' }
  $env:PATH = $portableNode.DirectoryName + ';' + $env:PATH
}
Write-Host 'O R D E R - Preparando terminal...' -ForegroundColor Magenta
if (-not (Test-Path -LiteralPath '.env')) { Copy-Item -LiteralPath '.env.example' -Destination '.env' }
if (-not (Test-Path -LiteralPath 'node_modules')) {
  & npm.cmd install
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar dependencias.' }
}
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Falha na compilacao. Consulte o erro acima.' }
Write-Host 'Abra http://localhost:3000 (ou a porta do .env). Mantenha este terminal aberto.' -ForegroundColor Magenta
& npm.cmd start
exit $LASTEXITCODE
