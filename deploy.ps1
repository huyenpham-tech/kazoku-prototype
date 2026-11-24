# Run this script from PowerShell to publish the current HTML files to Vercel.
# The folder is linked to the existing kazoku-prototype project; sign in if asked.
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
npx --yes vercel --prod
if ($LASTEXITCODE -ne 0) { throw "Vercel deployment failed (exit code $LASTEXITCODE)." }

