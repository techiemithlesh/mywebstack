# MyWebStack

A lightweight, portable web development stack for Windows — Apache, PHP, MySQL, and phpMyAdmin in one folder. No installer, no admin rights, no hassle. A better alternative to XAMPP.

[![Validate](https://github.com/techiemithlesh/mywebstack/actions/workflows/validate.yml/badge.svg)](https://github.com/techiemithlesh/mywebstack/actions/workflows/validate.yml)
[![Latest Release](https://img.shields.io/github/v/release/techiemithlesh/mywebstack)](https://github.com/techiemithlesh/mywebstack/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## Why MyWebStack?

| | MyWebStack | XAMPP |
|---|---|---|
| Portable (USB / any folder) | ✅ | ⚠️ |
| No installer needed | ✅ | ❌ |
| PHP version switching | ✅ (multiple side-by-side) | ❌ |
| MySQL 8.4 | ✅ | ❌ |
| PHP 8.5 | ✅ | ❌ |
| Open source / contributable | ✅ | ❌ |

---

## 🚀 Quick Start

### Method 1: Pre-bundled Release (Fastest)

1. 📦 [Download the latest release ZIP](https://github.com/techiemithlesh/mywebstack/releases/latest)
2. Extract to any folder (e.g. `C:\mywebstack`)
3. Run `start-stack.bat`
4. Open [http://localhost](http://localhost)

Done. Everything is pre-configured.

### Method 2: Clone + Automated Setup

```bash
git clone https://github.com/techiemithlesh/mywebstack.git
cd mywebstack
```

Place the following packages in the `packages/` folder:
- `Apache24.zip` — from [apachelounge.com](https://www.apachelounge.com/download/)
- `mysql-8.4.zip` — from [dev.mysql.com](https://dev.mysql.com/downloads/mysql/)
- `php-8.5.7-Win32-vs17-x64.zip` — from [windows.php.net](https://windows.php.net/download/)
- `phpmyadmin/` folder — from [phpmyadmin.net](https://www.phpmyadmin.net/downloads/)

Then run:

```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1
start-stack.bat
```

### Method 3: Manual Setup

See [Manual Setup](#manual-setup) below.

---

## 📂 Directory Structure

```
mywebstack/
├── apache/         Apache binaries (extracted by setup.ps1)
├── php/            PHP binaries (extracted by setup.ps1)
├── mysql/          MySQL binaries + data (extracted by setup.ps1)
├── phpmyadmin/     phpMyAdmin (extracted by setup.ps1)
├── packages/       Source ZIPs (you provide these)
├── templates/      Config templates used by setup.ps1
├── www/            Your web projects go here
├── logs/           Stack-level logs
├── setup.ps1       One-shot setup script
├── start-stack.bat Launch all services
└── stop-stack.bat  Stop all services
```

Each project lives in its own subfolder under `www/` and is accessible at `http://localhost/<project-name>`.

---

## 🔧 Common Tasks

### phpMyAdmin

URL: [http://localhost/phpmyadmin](http://localhost/phpmyadmin)

Default login: `root` / _(no password)_

### Set a MySQL root password

```powershell
$mysql = Get-ChildItem .\mysql -Recurse -Filter mysql.exe | Select-Object -First 1
& $mysql.FullName -u root
```

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'YourPassword';
FLUSH PRIVILEGES;
EXIT;
```

### Add a new project

1. Create `www\my-project\`
2. Copy `templates\.htaccess` into it
3. Add your PHP files
4. Visit `http://localhost/my-project`

### Stop the stack

Run `stop-stack.bat` or close the console windows.

---

## Manual Setup

<details>
<summary>Expand manual setup instructions</summary>

1. Clone or download the repository
2. Download and extract each component into its folder:
   - Apache → `apache/Apache24/`
   - PHP → `php/<version>/`
   - MySQL → `mysql/<version>/`
   - phpMyAdmin → `phpmyadmin/`
3. Copy template files and fill in your paths:
   - `templates/apache-httpd.conf.example` → `apache/Apache24/conf/httpd.conf`
   - `templates/php-php.ini.example` → `php/<version>/php.ini`
   - `templates/mysql-my.ini.example` → `mysql/<version>/my.ini`
4. Initialise MySQL: `mysqld --initialize-insecure`
5. Run `start-stack.bat`

</details>

---

## 🛠️ About setup.ps1

The setup script is fully automated and idempotent (safe to run multiple times):

- Extracts Apache, PHP, MySQL, phpMyAdmin from `packages/`
- Writes config files with the correct absolute paths for your machine
- Sets `MYWEBSTACK_HOME` environment variable
- Adds Apache, PHP, and MySQL binaries to your user `PATH`
- Creates the `www\phpmyadmin` junction
- Initialises the MySQL data directory if it doesn't exist
- Enables blank-password phpMyAdmin login for local development

---

## 📝 Notes

- **Development only** — do not expose this stack to the public internet without setting a MySQL password and locking down phpMyAdmin
- Default MySQL credentials: `root` / _(no password)_
- Ports: Apache on **80**, MySQL on **3306**
- Port conflicts: ensure nothing else is using those ports before starting

---

## 🔍 Troubleshooting

**Port already in use**
Check with `netstat -ano | findstr :80` and kill the conflicting process.

**setup.ps1 blocked by execution policy**
Run: `powershell -ExecutionPolicy Bypass -File setup.ps1`

**MySQL won't start**
Check `mysql\<version>\data\*.err` for the error log.

**Permission errors on symlink creation**
Run the script from an elevated (Administrator) PowerShell prompt.

---

## 🤝 Contributing

MyWebStack is open for contributions! We use a `development` branch as the integration point — all PRs should target `development`, not `main`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide: branch strategy, commit conventions, PR checklist, and how to cut a release.

Quick summary:
```bash
git checkout -b feature/your-feature development
# ... make changes ...
git push origin feature/your-feature
# Open PR → base: development
```

---

## 📋 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

## 📚 Resources

- [Apache Documentation](https://httpd.apache.org/docs/)
- [PHP Documentation](https://www.php.net/docs.php)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [phpMyAdmin Documentation](https://www.phpmyadmin.net/docs/)

---

## 📄 License

[MIT License](LICENSE)
