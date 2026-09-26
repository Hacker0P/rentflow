# Forward to scripts/start-all.ps1
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& "$scriptDir\scripts\start-all.ps1"
