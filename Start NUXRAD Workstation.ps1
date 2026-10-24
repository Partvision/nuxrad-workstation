$ErrorActionPreference = 'Stop'
$nuxNodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
$nuxNodePath = if ($nuxNodeCommand) { $nuxNodeCommand.Source } else { Join-Path $env:ProgramFiles 'nodejs\node.exe' }
$nuxLauncherPath = Join-Path $PSScriptRoot 'launcher.mjs'
if (-not (Test-Path -LiteralPath $nuxNodePath)) { throw 'Node.js is required to run the NUXRAD Workstation theme.' }
Start-Process -FilePath $nuxNodePath -ArgumentList @(('"{0}"' -f $nuxLauncherPath)) -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
