$nodeHome = 'E:\sky\tools\node-v16.20.2-win-x64'

if (Test-Path $nodeHome) {
  $env:PATH = "$nodeHome;$env:PATH"
  & "$nodeHome\npm.cmd" run serve:parallel
} else {
  Write-Warning "Portable Node 16 runtime not found at $nodeHome. Falling back to the current PATH."
  npm run serve:parallel
}
