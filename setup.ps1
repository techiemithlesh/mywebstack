Write-Host "🔧 Setting up MyWebStack..."

# === 1. Create Required Folders ===
$folders = @("apache", "php", "mysql", "phpmyadmin", "www", "logs")
foreach ($folder in $folders) {
    if (-Not (Test-Path $folder)) {
        Write-Host "📁 Creating folder: $folder"
        New-Item -ItemType Directory -Path $folder | Out-Null
    }
}

# === 2. Download & Extract Apache (if not present) ===
if (-Not (Test-Path "apache\Apache24\bin\httpd.exe")) {
    Write-Host "🌐 Downloading Apache..."
    $apacheUrl = "https://www.apachelounge.com/download/VS17/binaries/httpd-2.4.57-win64-VS17.zip"
    $apacheZip = "apache.zip"
    Invoke-WebRequest -Uri $apacheUrl -OutFile $apacheZip
    Expand-Archive $apacheZip -DestinationPath "apache"
    Remove-Item $apacheZip
    Write-Host "✅ Apache extracted."
} else {
    Write-Host "✅ Apache already exists, skipping..."
}

# === 3. Download & Extract PHP (if not present) ===
if (-Not (Test-Path "php\php.exe")) {
    Write-Host "🌐 Downloading PHP..."
    $phpUrl = "https://windows.php.net/downloads/releases/php-7.4.33-Win32-vc15-x64.zip"
    $phpZip = "php.zip"
    Invoke-WebRequest -Uri $phpUrl -OutFile $phpZip
    Expand-Archive $phpZip -DestinationPath "php"
    Remove-Item $phpZip
    Write-Host "✅ PHP extracted."
} else {
    Write-Host "✅ PHP already exists, skipping..."
}

# === 4. Download & Extract MySQL (if not present) ===
if (-Not (Test-Path "mysql\bin\mysqld.exe")) {
    Write-Host "🌐 Downloading MySQL..."
    $mysqlUrl = "https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-8.0.36-winx64.zip"
    $mysqlZip = "mysql.zip"
    Invoke-WebRequest -Uri $mysqlUrl -OutFile $mysqlZip
    Expand-Archive $mysqlZip -DestinationPath "mysql"
    Remove-Item $mysqlZip
    Write-Host "✅ MySQL extracted."
} else {
    Write-Host "✅ MySQL already exists, skipping..."
}

# === 5. Download & Extract phpMyAdmin (if not present) ===
if (-Not (Test-Path "phpmyadmin\index.php")) {
    Write-Host "🌐 Downloading phpMyAdmin..."
    $pmaUrl = "https://files.phpmyadmin.net/phpMyAdmin/5.2.1/phpMyAdmin-5.2.1-all-languages.zip"
    $pmaZip = "phpmyadmin.zip"
    Invoke-WebRequest -Uri $pmaUrl -OutFile $pmaZip
    Expand-Archive $pmaZip -DestinationPath "phpmyadmin"
    # Move inner folder content up
    $inner = Get-ChildItem phpmyadmin | Where-Object { $_.PsIsContainer } | Select-Object -First 1
    Move-Item "phpmyadmin\$($inner.Name)\*" "phpmyadmin" -Force
    Remove-Item "phpmyadmin\$($inner.Name)" -Recurse -Force
    Remove-Item $pmaZip
    Write-Host "✅ phpMyAdmin extracted."
} else {
    Write-Host "✅ phpMyAdmin already exists, skipping..."
}

# === 6. Copy Template Config Files ===
Copy-Item templates\apache-httpd.conf.example apache\Apache24\conf\httpd.conf -Force
Copy-Item templates\php-php.ini.example php\php.ini -Force
Copy-Item templates\mysql-my.ini.example mysql\my.ini -Force

# === 7. Create Symlink in www for phpMyAdmin ===
if (-Not (Test-Path "www\phpmyadmin")) {
    Write-Host "🔗 Creating symlink: www/phpmyadmin → phpmyadmin"
    cmd /c mklink /D www\phpmyadmin phpmyadmin | Out-Null
} else {
    Write-Host "✅ phpMyAdmin symlink already exists."
}

Write-Host ""
Write-Host "🎉 Setup complete!"
Write-Host "➡️  Run start-stack.bat to launch Apache + MySQL"
