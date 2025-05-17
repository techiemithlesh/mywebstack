# MyWebStack

A lightweight, portable web development stack for Windows with Apache, PHP, MySQL, and phpMyAdmin.

## 🚀 Quick Start Guide

### Method 1: Pre-bundled Release (Fastest)

1. Download the [pre-bundled release package (v0.1.1)](https://github.com/techiemithlesh/mywebstack/releases/tag/v0.1.1)
2. Extract the zip file to a location of C Drive
3. Rename Folder to MyWebStack
4. Run `start-stack.bat` to launch the stack
5. Open your browser and navigate to [http://localhost](http://localhost)

That's it! Everything is pre-configured and ready to use.

### Method 2: Automated Setup

If you prefer to build from source:

1. Clone the repository:
   ```bash
   git clone https://github.com/techiemithlesh/mywebstack.git
   cd mywebstack
   ```

2. Run the automated setup script (requires PowerShell):
   ```powershell
   powershell -ExecutionPolicy Bypass -File setup.ps1
   ```
   
   This script will:
   - Create all necessary directories
   - Download and extract Apache, PHP, MySQL, and phpMyAdmin
   - Apply configuration templates
   - Create required symlinks
   - Prepare the environment for use

3. Start the stack:
   ```bash
   start-stack.bat
   ```

4. Open your browser and navigate to [http://localhost](http://localhost)

### Method 3: Manual Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/techiemithlesh/mywebstack.git
cd mywebstack
```

#### 2. Download Required Components

Download and extract the following components:

- [Apache for Windows](https://www.apachelounge.com/download/)
- [PHP for Windows](https://windows.php.net/download/)
- [MySQL ZIP Archive](https://dev.mysql.com/downloads/mysql/)
- [(Optional) phpMyAdmin](https://www.phpmyadmin.net/downloads/)

#### 3. Setup Directory Structure

Place the extracted components in the following directories:

```
mywebstack/
├── apache/         # Apache files (Apache24 folder)
├── php/            # PHP files
├── mysql/          # MySQL files
├── phpmyadmin/     # phpMyAdmin files (optional)
├── www/            # Your web projects go here
├── templates/      # Configuration templates
├── setup.ps1       # Automated setup script
├── start-stack.bat # Script to start the stack
└── stop-stack.bat  # Script to stop the stack
```

#### 4. Configure the Stack

Copy and customize the configuration templates:

1. Apache configuration:
   ```
   templates/apache-httpd.conf.example → apache/Apache24/conf/httpd.conf
   ```

2. PHP configuration:
   ```
   templates/php-php.ini.example → php/php.ini
   ```

3. MySQL configuration:
   ```
   templates/mysql-my.ini.example → mysql/my.ini
   ```

4. .htaccess file:
   ```
   templates/.htaccess → Place into each project folder inside www/
   ```

### 5. Start the Stack

1. Run `start-stack.bat` to launch all services
2. Open your browser and navigate to [http://localhost](http://localhost)
3. Your web projects in the `www/` directory are now accessible

### 6. Stop the Stack

Run `stop-stack.bat` to safely shut down all services

## 📂 Project Structure

Each project should be placed in its own directory under the `www/` folder:

```
www/
├── project1/
│   ├── .htaccess
│   ├── index.php
│   └── ...
├── project2/
│   ├── .htaccess
│   ├── index.php
│   └── ...
└── phpmyadmin/ (symlink to ../phpmyadmin created by setup.ps1)
```

## 🔧 Common Tasks

### Accessing phpMyAdmin

phpMyAdmin is available at [http://localhost/phpmyadmin](http://localhost/phpmyadmin)

### Creating a New Database

1. Open phpMyAdmin
2. Click "New" in the left sidebar
3. Enter a database name and click "Create"

### Adding a New Project

1. Create a new folder in the `www/` directory
2. Copy the `.htaccess` file from `templates/` into your project folder
3. Add your PHP files to the project folder
4. Access your project at `http://localhost/your-project-folder`

## 🧰 Features of Pre-bundled Release

The [pre-bundled release](https://github.com/techiemithlesh/mywebstack/releases/tag/v0.1.1) comes with everything you need:

- **Zero Configuration Required** - Just extract and run
- **All Components Included**:
  - Apache 2.4.57
  - PHP 7.4.33
  - MySQL 8.0.36
  - phpMyAdmin 5.2.1
- **Pre-configured Settings** - Optimized for development use
- **Portable** - Can be moved to any location or USB drive
- **Instant Web Development Environment** - No installation needed

Simply download, extract, and start developing immediately!

## 🛠️ About the Setup Script

The `setup.ps1` PowerShell script automates the setup process with these features:

- **Automatic Directory Creation**: Creates all necessary folders (apache, php, mysql, phpmyadmin, www, logs)
- **Component Downloads**: Automatically downloads and extracts the latest compatible versions of:
  - Apache 2.4.57 (VS17)
  - PHP 7.4.33
  - MySQL 8.0.36
  - phpMyAdmin 5.2.1
- **Configuration**: Copies template configuration files to their proper locations
- **Symlink Creation**: Creates a symbolic link to phpMyAdmin in the www directory
- **Smart Checks**: Only downloads components that aren't already present

To run the script:
```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1
```

> **Note**: You may need to run PowerShell as Administrator for symlink creation to work properly.

## 📝 Notes

- This is a development stack and not recommended for production use
- Default MySQL credentials: root (no password)
- Remember to secure your installation if used on a public-facing network

## 🔍 Troubleshooting

- **Port conflicts**: Ensure ports 80 (Apache) and 3306 (MySQL) are available
- **Service errors**: Check the respective log files in each service directory
- **Permission issues**: Run the batch files as administrator if needed

## 📚 Resources

- [Apache Documentation](https://httpd.apache.org/docs/)
- [PHP Documentation](https://www.php.net/docs.php)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [phpMyAdmin Documentation](https://www.phpmyadmin.net/docs/)

## 📄 License

[MIT License](LICENSE)
