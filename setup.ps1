$ErrorActionPreference = "Stop"

Write-Host "====================================="
Write-Host "      MyWebStack Setup"
Write-Host "====================================="
Write-Host ""

$stackRoot = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($stackRoot)) {
    $stackRoot = (Get-Location).Path
}

$packagesRoot = Join-Path $stackRoot "packages"
$requiredFolders = @("apache", "php", "mysql", "phpmyadmin", "www", "logs", "templates")

function Convert-ToApachePath {
    param([Parameter(Mandatory = $true)][string]$Path)
    return ($Path -replace "\\", "/")
}

function Ensure-Folder {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (!(Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
        Write-Host "[CREATED] $Path"
    }
}

function Expand-Package {
    param(
        [Parameter(Mandatory = $true)][string]$ZipName,
        [Parameter(Mandatory = $true)][string]$Destination,
        [string]$RootlessFolderName
    )

    $zipPath = Join-Path $packagesRoot $ZipName
    if (!(Test-Path -LiteralPath $zipPath)) {
        Write-Host "[SKIP] Package not found: packages\$ZipName"
        return
    }

    Ensure-Folder $Destination

    $probeRoot = Join-Path $env:TEMP ("mywebstack-probe-" + [guid]::NewGuid().ToString("N"))
    $extractRoot = Join-Path $env:TEMP ("mywebstack-extract-" + [guid]::NewGuid().ToString("N"))

    try {
        New-Item -ItemType Directory -Path $probeRoot, $extractRoot -Force | Out-Null
        Expand-Archive -LiteralPath $zipPath -DestinationPath $probeRoot -Force

        $probeItems = Get-ChildItem -LiteralPath $probeRoot -Force
        $hasSingleFolderRoot = ($probeItems.Count -eq 1 -and $probeItems[0].PSIsContainer)

        if ($hasSingleFolderRoot) {
            $targetPath = Join-Path $Destination $probeItems[0].Name
            $targetHasContent = (Test-Path -LiteralPath $targetPath) -and
                ($null -ne (Get-ChildItem -LiteralPath $targetPath -Force -ErrorAction SilentlyContinue | Select-Object -First 1))

            if ($targetHasContent) {
                Write-Host "[OK] Already extracted: $targetPath"
                return
            }

            Expand-Archive -LiteralPath $zipPath -DestinationPath $Destination -Force
            Write-Host "[OK] Extracted $ZipName to $Destination"
            return
        }

        if ([string]::IsNullOrWhiteSpace($RootlessFolderName)) {
            $RootlessFolderName = [System.IO.Path]::GetFileNameWithoutExtension($ZipName)
        }

        $targetPath = Join-Path $Destination $RootlessFolderName
        $targetHasContent = (Test-Path -LiteralPath $targetPath) -and
            ($null -ne (Get-ChildItem -LiteralPath $targetPath -Force -ErrorAction SilentlyContinue | Select-Object -First 1))

        if ($targetHasContent) {
            Write-Host "[OK] Already extracted: $targetPath"
            return
        }

        Ensure-Folder $targetPath
        Expand-Archive -LiteralPath $zipPath -DestinationPath $extractRoot -Force
        Get-ChildItem -LiteralPath $extractRoot -Force | Copy-Item -Destination $targetPath -Recurse -Force
        Write-Host "[OK] Extracted $ZipName to $targetPath"
    }
    finally {
        Remove-Item -LiteralPath $probeRoot, $extractRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Find-FirstFile {
    param(
        [Parameter(Mandatory = $true)][string]$Root,
        [Parameter(Mandatory = $true)][string]$Filter
    )

    return Get-ChildItem -LiteralPath $Root -Recurse -Filter $Filter -ErrorAction SilentlyContinue |
        Select-Object -First 1
}

function Add-ToUserPath {
    param([Parameter(Mandatory = $true)][string[]]$Paths)

    $currentUserPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $pathParts = @()
    if (![string]::IsNullOrWhiteSpace($currentUserPath)) {
        $pathParts = $currentUserPath -split ";" | Where-Object { ![string]::IsNullOrWhiteSpace($_) }
    }

    $changed = $false
    foreach ($path in $Paths) {
        if ((Test-Path -LiteralPath $path) -and !($pathParts -contains $path)) {
            $pathParts += $path
            $changed = $true
            Write-Host "[OK] Added to user PATH: $path"
        }
    }

    if ($changed) {
        [Environment]::SetEnvironmentVariable("Path", ($pathParts -join ";"), "User")
    }

    $env:Path = (($env:Path -split ";") + $Paths | Where-Object {
        ![string]::IsNullOrWhiteSpace($_)
    } | Select-Object -Unique) -join ";"
}

function Enable-PhpMyAdminNoPasswordLogin {
    param([Parameter(Mandatory = $true)][string]$ConfigPath)

    if (!(Test-Path -LiteralPath $ConfigPath)) {
        return
    }

    $config = Get-Content -LiteralPath $ConfigPath -Raw
    $allowNoPasswordLine = '$cfg[''Servers''][$i][''AllowNoPassword''] = true;'

    if ($config -match "\`$cfg\['Servers'\]\[\`$i\]\['AllowNoPassword'\]\s*=") {
        $config = $config -replace "\`$cfg\['Servers'\]\[\`$i\]\['AllowNoPassword'\]\s*=\s*(true|false)\s*;", $allowNoPasswordLine
    }
    else {
        $hostPattern = "\`$cfg\['Servers'\]\[\`$i\]\['host'\]\s*=\s*'[^']+'\s*;"
        if ($config -match $hostPattern) {
            $config = $config -replace $hostPattern, ("`$&`r`n" + $allowNoPasswordLine)
        }
        else {
            $config += "`r`n" + $allowNoPasswordLine + "`r`n"
        }
    }

    Set-Content -LiteralPath $ConfigPath -Value $config -Encoding ASCII
    Write-Host "[OK] phpMyAdmin blank-password login enabled"
}

foreach ($folder in $requiredFolders) {
    Ensure-Folder (Join-Path $stackRoot $folder)
}

Write-Host ""
Write-Host "Extracting bundled packages..."
Write-Host ""

Expand-Package -ZipName "Apache24.zip" -Destination (Join-Path $stackRoot "apache")
Expand-Package -ZipName "mysql-8.4.zip" -Destination (Join-Path $stackRoot "mysql")
Expand-Package -ZipName "php-7.4.3.zip" -Destination (Join-Path $stackRoot "php")
Expand-Package -ZipName "php-8.5.7-Win32-vs17-x64.zip" -Destination (Join-Path $stackRoot "php") -RootlessFolderName "php-8.5.7-Win32-vs17-x64"

$phpMyAdminZip = Join-Path $packagesRoot "phpmyadmin.zip"
if ((Test-Path -LiteralPath $phpMyAdminZip) -and !(Find-FirstFile -Root (Join-Path $stackRoot "phpmyadmin") -Filter "index.php")) {
    $phpMyAdminParent = $stackRoot
    Expand-Package -ZipName "phpmyadmin.zip" -Destination $phpMyAdminParent
}

Enable-PhpMyAdminNoPasswordLogin -ConfigPath (Join-Path $stackRoot "phpmyadmin\config.inc.php")

Write-Host ""
Write-Host "Detecting installations..."
Write-Host ""

$apacheExe = Find-FirstFile -Root (Join-Path $stackRoot "apache") -Filter "httpd.exe"
$phpExe = Find-FirstFile -Root (Join-Path $stackRoot "php") -Filter "php.exe"
$mysqlExe = Find-FirstFile -Root (Join-Path $stackRoot "mysql") -Filter "mysqld.exe"

if (!$apacheExe) {
    Write-Host "[WARNING] Apache not installed. Expected httpd.exe under apache"
}

if (!$phpExe) {
    Write-Host "[WARNING] PHP not installed. Expected php.exe under php"
}

if (!$mysqlExe) {
    Write-Host "[WARNING] MySQL not installed. Expected mysqld.exe under mysql"
}

$apacheRoot = if ($apacheExe) { Split-Path (Split-Path $apacheExe.FullName) } else { Join-Path $stackRoot "apache\Apache24" }
$phpRoot = if ($phpExe) { Split-Path $phpExe.FullName } else { Join-Path $stackRoot "php" }
$mysqlRoot = if ($mysqlExe) { Split-Path (Split-Path $mysqlExe.FullName) } else { Join-Path $stackRoot "mysql" }
$phpApacheDll = Find-FirstFile -Root $phpRoot -Filter "php*apache2_4.dll"
$phpApacheModule = "php_module"

if ($phpApacheDll -and $phpApacheDll.Name -like "php7*") {
    $phpApacheModule = "php7_module"
}

if ($apacheExe) {
    Write-Host "[OK] Apache Found"
    Write-Host "     $($apacheExe.FullName)"
}

if ($phpExe) {
    Write-Host "[OK] PHP Found"
    Write-Host "     $($phpExe.FullName)"
}

if ($mysqlExe) {
    Write-Host "[OK] MySQL Found"
    Write-Host "     $($mysqlExe.FullName)"
}

Write-Host ""
Write-Host "Writing dynamic configuration..."
Write-Host ""

$apacheConfDir = Join-Path $apacheRoot "conf"
Ensure-Folder $apacheConfDir

if (!$phpApacheDll) {
    Write-Host "[WARNING] Apache PHP module DLL was not found under $phpRoot"
}

$phpApacheDllPath = if ($phpApacheDll) { $phpApacheDll.FullName } else { Join-Path $phpRoot "php7apache2_4.dll" }
$apacheTemplate = Join-Path $stackRoot "templates\apache-httpd.conf.example"

if (Test-Path -LiteralPath $apacheTemplate) {
    $apacheConf = (Get-Content -LiteralPath $apacheTemplate -Raw).
        Replace("{{APACHE_ROOT}}", (Convert-ToApachePath $apacheRoot)).
        Replace("{{WWW_ROOT}}", (Convert-ToApachePath (Join-Path $stackRoot "www"))).
        Replace("{{PHP_APACHE_MODULE}}", $phpApacheModule).
        Replace("{{PHP_APACHE_DLL}}", (Convert-ToApachePath $phpApacheDllPath)).
        Replace("{{PHP_ROOT}}", (Convert-ToApachePath $phpRoot))
}
else {
    $apacheConf = @"
ServerRoot "$(Convert-ToApachePath $apacheRoot)"
Listen 80
ServerName localhost

DocumentRoot "$(Convert-ToApachePath (Join-Path $stackRoot "www"))"
<Directory "$(Convert-ToApachePath (Join-Path $stackRoot "www"))">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
    <FilesMatch "\.(php|php8|phtml)$">
        SetHandler application/x-httpd-php
    </FilesMatch>
</Directory>

LoadModule authz_core_module modules/mod_authz_core.so
LoadModule authz_host_module modules/mod_authz_host.so
LoadModule alias_module modules/mod_alias.so
LoadModule dir_module modules/mod_dir.so
LoadModule env_module modules/mod_env.so
LoadModule headers_module modules/mod_headers.so
LoadModule mime_module modules/mod_mime.so
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule $phpApacheModule "$(Convert-ToApachePath $phpApacheDllPath)"
AddType application/x-httpd-php .php .php8 .phtml
PHPIniDir "$(Convert-ToApachePath $phpRoot)"

DirectoryIndex index.php index.html
"@
}

Set-Content -LiteralPath (Join-Path $apacheConfDir "httpd.conf") -Value $apacheConf -Encoding ASCII
Write-Host "[OK] Apache config generated"

$phpIniPath = Join-Path $phpRoot "php.ini"
$phpIniTemplate = Join-Path $stackRoot "templates\php-php.ini.example"
if (Test-Path -LiteralPath $phpIniTemplate) {
    $phpIni = (Get-Content -LiteralPath $phpIniTemplate -Raw).
        Replace("{{PHP_EXT_DIR}}", (Convert-ToApachePath (Join-Path $phpRoot "ext")))
}
else {
    $phpIni = @"
[PHP]
extension_dir = "$(Convert-ToApachePath (Join-Path $phpRoot "ext"))"
display_errors = On
error_reporting = E_ALL

extension=mysqli
extension=pdo_mysql
extension=mbstring
extension=curl
extension=openssl
extension=zip
extension=intl
"@
}

Set-Content -LiteralPath $phpIniPath -Value $phpIni -Encoding ASCII
Write-Host "[OK] PHP config generated"

$mysqlData = Join-Path $mysqlRoot "data"
Ensure-Folder $mysqlData

$mysqlTemplate = Join-Path $stackRoot "templates\mysql-my.ini.example"
if (Test-Path -LiteralPath $mysqlTemplate) {
    $mysqlIni = (Get-Content -LiteralPath $mysqlTemplate -Raw).
        Replace("{{MYSQL_ROOT}}", (Convert-ToApachePath $mysqlRoot)).
        Replace("{{MYSQL_DATA}}", (Convert-ToApachePath $mysqlData))
}
else {
    $mysqlIni = @"
[mysqld]
port=3306
basedir="$(Convert-ToApachePath $mysqlRoot)"
datadir="$(Convert-ToApachePath $mysqlData)"
sql_mode=NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES
"@
}

$mysqlIniPath = Join-Path $mysqlRoot "my.ini"
Set-Content -LiteralPath $mysqlIniPath -Value $mysqlIni -Encoding ASCII
Write-Host "[OK] MySQL config generated"

$mysqlSystemTables = Join-Path $mysqlData "mysql"
if ($mysqlExe -and !(Test-Path -LiteralPath $mysqlSystemTables)) {
    Write-Host "[INFO] Initializing MySQL data directory..."
    try {
        & $mysqlExe.FullName --defaults-file="$mysqlIniPath" --initialize-insecure --console
        if ($LASTEXITCODE -ne 0) {
            throw "mysqld exited with code $LASTEXITCODE"
        }
        Write-Host "[OK] MySQL data directory initialized"
    }
    catch {
        Write-Host "[WARNING] MySQL initialization failed: $($_.Exception.Message)"
    }
}

$phpMyAdminLink = Join-Path $stackRoot "www\phpmyadmin"
$phpMyAdminTarget = (Resolve-Path (Join-Path $stackRoot "phpmyadmin")).Path
$shouldCreatePhpMyAdminLink = $true

if (Test-Path -LiteralPath $phpMyAdminLink) {
    $existingPhpMyAdminLink = Get-Item -LiteralPath $phpMyAdminLink -Force
    $existingTarget = if ($existingPhpMyAdminLink.Target) { [string]$existingPhpMyAdminLink.Target[0] } else { "" }

    if ($existingPhpMyAdminLink.LinkType -eq "Junction" -and $existingTarget -ieq $phpMyAdminTarget) {
        $shouldCreatePhpMyAdminLink = $false
    }
    else {
        Remove-Item -LiteralPath $phpMyAdminLink -Force
        Write-Host "[OK] Removed stale phpMyAdmin link"
    }
}

if ($shouldCreatePhpMyAdminLink) {
    try {
        New-Item `
            -ItemType Junction `
            -Path $phpMyAdminLink `
            -Target $phpMyAdminTarget `
            -Force | Out-Null

        Write-Host "[OK] phpMyAdmin junction created"
    }
    catch {
        Write-Host "[WARNING] Unable to create phpMyAdmin junction: $($_.Exception.Message)"
    }
}

[Environment]::SetEnvironmentVariable("MYWEBSTACK_HOME", $stackRoot, "User")
$env:MYWEBSTACK_HOME = $stackRoot
Write-Host "[OK] MYWEBSTACK_HOME set to $stackRoot"

$pathCandidates = @(
    (Join-Path $apacheRoot "bin"),
    $phpRoot,
    (Join-Path $mysqlRoot "bin")
)
Add-ToUserPath -Paths $pathCandidates

Write-Host ""
Write-Host "====================================="
Write-Host " Setup Complete"
Write-Host "====================================="
Write-Host ""
Write-Host "Stack root:"
Write-Host $stackRoot
Write-Host ""
Write-Host "Next Step:"
Write-Host "Run start-stack.bat"
Write-Host ""

Read-Host "Press Enter to continue"
