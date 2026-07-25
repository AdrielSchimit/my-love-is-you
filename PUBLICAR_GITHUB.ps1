$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$RepoUrl = 'https://github.com/AdrielSchimit/my-love-is-you.git'
$CommitMessage = 'feat: initialize My love is You production app'

Write-Host '== My love is You: publicação no GitHub ==' -ForegroundColor Magenta

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw 'Git não foi encontrado. Instale o Git for Windows e tente novamente.'
}

if (-not (Test-Path '.git')) {
  git init
}

git branch -M main

$origin = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
  git remote add origin $RepoUrl
} elseif ($origin -ne $RepoUrl) {
  git remote set-url origin $RepoUrl
}

$userName = git config user.name
$userEmail = git config user.email
if ([string]::IsNullOrWhiteSpace($userName) -or [string]::IsNullOrWhiteSpace($userEmail)) {
  throw 'O Git ainda não possui user.name e user.email. Configure a identidade do Git e execute novamente.'
}

git add -A
$hasChanges = -not (git diff --cached --quiet; $LASTEXITCODE -eq 0)
if ($hasChanges) {
  git commit -m $CommitMessage
} else {
  Write-Host 'Nenhuma alteração nova para commit.' -ForegroundColor Yellow
}

Write-Host 'Enviando para origin/main...' -ForegroundColor Cyan
git push -u origin main

Write-Host ''
Write-Host 'Concluído. Último commit:' -ForegroundColor Green
git log -1 --oneline
