Write-Host "Setting up MyWebStack..."

# 1. Create folders if not exist
$folders = @("apache", "php", "mysql", "phpmyadmin", "www", "logs")
foreach ($folder in $folders) {
    if (-Not (Test-Path $folder)) {
        Write-Host "Creating folder: $folder"
        New-Item -ItemType Directory -Path $folder | Out-Null
    }
}

# 2. Apache
if (-Not (Test-Path "apache\Apache24\bin\httpd.exe")) {
    Write-Host "Downloading Apache..."
    $apacheUrl = "https://www.apachelounge.com/download/VS17/binaries/httpd-2.4.57-win64-VS17.zip"
    $apacheZip = "apache.zip"
    Invoke-WebRequest -Uri $apacheUrl -OutFile $apacheZip
    Expand-Archive $apacheZip -DestinationPath "apache"
    Remove-Item $apacheZip
} else {
    Write-Host "Apache already exists. Skipping..."
}

# 3. PHP
if (-Not (Test-Path "php\php.exe")) {
    Write-Host "Downloading PHP..."
    $phpUrl = "https://windows.php.net/downloads/releases/php-7.4.33-Win32-vc15-x64.zip"
    $phpZip = "php.zip"
    Invoke-WebRequest -Uri $phpUrl -OutFile $phpZip
    Expand-Archive $phpZip -DestinationPath "php"
    Remove-Item $phpZip
} else {
    Write-Host "PHP already exists. Skipping..."
}

# 4. MySQL
if (-Not (Test-Path "mysql\bin\mysqld.exe")) {
    Write-Host "Downloading MySQL..."
    $mysqlUrl = "https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-8.0.36-winx64.zip"
    $mysqlZip = "mysql.zip"
    Invoke-WebRequest -Uri $mysqlUrl -OutFile $mysqlZip
    Expand-Archive $mysqlZip -DestinationPath "mysql"
    Remove-Item $mysqlZip
} else {
    Write-Host "MySQL already exists. Skipping..."
}

# 5. phpMyAdmin
if (-Not (Test-Path "phpmyadmin\index.php")) {
    Write-Host "Downloading phpMyAdmin..."
    $pmaUrl = "https://files.phpmyadmin.net/phpMyAdmin/5.2.1/phpMyAdmin-5.2.1-all-languages.zip"
    $pmaZip = "phpmyadmin.zip"
    Invoke-WebRequest -Uri $pmaUrl -OutFile $pmaZip
    Expand-Archive $pmaZip -DestinationPath "phpmyadmin"
    $inner = Get-ChildItem phpmyadmin | Where-Object { $_.PsIsContainer } | Select-Object -First 1
    Move-Item "phpmyadmin\$($inner.Name)\*" "phpmyadmin" -Force
    Remove-Item "phpmyadmin\$($inner.Name)" -Recurse -Force
    Remove-Item $pmaZip
} else {
    Write-Host "phpMyAdmin already exists. Skipping..."
}

# 6. Copy config templates
Copy-Item templates\apache-httpd.conf.example apache\Apache24\conf\httpd.conf -Force
Copy-Item templates\php-php.ini.example php\php.ini -Force
Copy-Item templates\mysql-my.ini.example mysql\my.ini -Force

# 7. Create symlink to phpMyAdmin
if (-Not (Test-Path "www\phpmyadmin")) {
    Write-Host "Creating symlink: www/phpmyadmin -> phpmyadmin"
    cmd /c mklink /D www\phpmyadmin phpmyadmin | Out-Null
} else {
    Write-Host "phpMyAdmin symlink already exists."
}

Write-Host ""
Write-Host "Setup complete! You can now run start-stack.bat"
