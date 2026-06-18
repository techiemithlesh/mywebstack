$ErrorActionPreference = "Stop"

$stackRoot = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($stackRoot)) {
    $stackRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}

function Find-FirstFile {
    param(
        [Parameter(Mandatory = $true)][string]$Root,
        [Parameter(Mandatory = $true)][string]$Filter
    )

    return Get-ChildItem -LiteralPath $Root -Recurse -Filter $Filter -ErrorAction SilentlyContinue |
        Select-Object -First 1
}

function Test-ProcessRunningFromPath {
    param([Parameter(Mandatory = $true)][string]$Path)

    $resolved = [System.IO.Path]::GetFullPath($Path)
    return $null -ne (Get-Process -ErrorAction SilentlyContinue | Where-Object {
        try {
            $_.Path -and ([System.IO.Path]::GetFullPath($_.Path) -ieq $resolved)
        }
        catch {
            $false
        }
    } | Select-Object -First 1)
}

$apacheExe = Find-FirstFile -Root (Join-Path $stackRoot "apache") -Filter "httpd.exe"
$phpExe = Find-FirstFile -Root (Join-Path $stackRoot "php") -Filter "php.exe"
$mysqlExe = Find-FirstFile -Root (Join-Path $stackRoot "mysql") -Filter "mysqld.exe"

if (!$apacheExe) {
    Write-Host "Apache was not found. Run setup.ps1 first."
    exit 1
}

if (!$mysqlExe) {
    Write-Host "MySQL was not found. Run setup.ps1 first."
    exit 1
}

$apacheRoot = Split-Path (Split-Path $apacheExe.FullName)
$mysqlRoot = Split-Path (Split-Path $mysqlExe.FullName)
$apacheConf = Join-Path $apacheRoot "conf\httpd.conf"
$mysqlConfig = Join-Path $mysqlRoot "my.ini"

if ($phpExe) {
    $phpRoot = Split-Path $phpExe.FullName
    $env:Path = "$phpRoot;$env:Path"
}

$env:Path = "$(Join-Path $mysqlRoot "bin");$(Join-Path $apacheRoot "bin");$env:Path"

Write-Host "Starting Apache..."
if (Test-ProcessRunningFromPath -Path $apacheExe.FullName) {
    Write-Host "Apache is already running."
}
else {
    $apacheArgs = @("-d", $apacheRoot, "-f", $apacheConf)
    Start-Process -FilePath $apacheExe.FullName -ArgumentList $apacheArgs -WorkingDirectory (Split-Path $apacheExe.FullName) -WindowStyle Hidden | Out-Null
    Start-Sleep -Seconds 2

    if (Test-ProcessRunningFromPath -Path $apacheExe.FullName) {
        Write-Host "Apache started."
    }
    else {
        Write-Host "Apache failed to start. Check apache\Apache24\logs\error.log"
        exit 1
    }
}

Write-Host "Starting MySQL..."
if (Test-ProcessRunningFromPath -Path $mysqlExe.FullName) {
    Write-Host "MySQL is already running."
}
else {
    Start-Process -FilePath $mysqlExe.FullName -ArgumentList @("--defaults-file=$mysqlConfig") -WorkingDirectory (Split-Path $mysqlExe.FullName) -WindowStyle Hidden | Out-Null
    Start-Sleep -Seconds 2

    if (Test-ProcessRunningFromPath -Path $mysqlExe.FullName) {
        Write-Host "MySQL started."
    }
    else {
        Write-Host "MySQL failed to start. Check mysql logs."
        exit 1
    }
}

Write-Host ""
Write-Host "Open http://localhost/"
