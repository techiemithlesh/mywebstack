# MyWebStack

A lightweight, portable web development stack for Windows — Apache, PHP, MySQL, and phpMyAdmin in one folder. Comes with a modern GUI control panel. No hassle, no bloat.

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
| GUI control panel | ✅ | ✅ |
| PHP version switching | ✅ (multiple side-by-side) | ❌ |
| MySQL 8.4 | ✅ | ❌ |
| PHP 8.5 | ✅ | ❌ |
| Open source / contributable | ✅ | ❌ |

---

## 🖥️ GUI Control Panel

MyWebStack ships with a minimal, modern desktop app built on [Electron](https://www.electronjs.org/).

![MyWebStack GUI](app/assets/icon.svg)

### Features

- **Dashboard** — Live Apache & MySQL status cards with one-click Start / Stop
- **PHP Versions** — Switch between installed PHP versions; Apache restarts automatically
- **Activity Log** — Real-time event stream + Apache and MySQL error log viewer
- **Settings** — Configure ports, auto-start on launch, minimise to tray
- **System tray** — Persistent icon with Start All / Stop All and quick links

### Get the app

| Download | Description |
|---|---|
| [MyWebStack-Setup-1.0.0.exe](https://github.com/techiemithlesh/mywebstack/releases/latest) | Windows installer — creates shortcuts & uninstaller |
| [MyWebStack-Portable-1.0.0.exe](https://github.com/techiemithlesh/mywebstack/releases/latest) | Single portable EXE, copy anywhere |

### Build from source

```bash
cd app
npm install
npm start          # run in dev mode
npm run build      # produces dist/MyWebStack-Setup-*.exe and dist/MyWebStack-Portable-*.exe
```

See [`app/BUILD.md`](app/BUILD.md) for full build instructions.

---

## 🚀 Quick Start

### Method 1: Installer (Recommended)

1. [Download `MyWebStack-Setup-1.0.0.exe`](https://github.com/techiemithlesh/mywebstack/releases/latest) and run it
2. The installer creates `packages\README.txt` listing the ZIPs to download
3. Place the ZIPs in `packages\`, then click **Run Setup** inside the app (or run `setup.ps1`)
4. Click **Start All** — done

### Method 2: Portable / Clone

```bash
git clone https://github.com/techiemithlesh/mywebstack.git
cd mywebstack
```

Place the following packages in the `packages/` folder:

- `Apache24.zip` — from [apachelounge.com](https://www.apachelounge.com/download/)
- `mysql-8.4.zip` — from [dev.mysql.com](https://dev.mysql.com/downloads/mysql/)
- `php-8.5.7-Win32-vs17-x64.zip` — from [windows.php.net](https://windows.php.net/download/) *(Thread Safe, x64)*
- `phpmyadmin/` folder — from [phpmyadmin.net](https://www.phpmyadmin.net/downloads/)

Then run setup and start the stack:

```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1
start-stack.bat
```

Or open the GUI app and click **Start All**.

---

## 📂 Directory Structure

```
mywebstack/
├── app/            GUI control panel (Electron)
│   ├── main.js
│   ├── index.html
│   └── BUILD.md
├── apache/         Apache binaries (extracted by setup.ps1)
├── php/            PHP binaries — one subfolder per version
├── mysql/          MySQL binaries + data (extracted by setup.ps1)
├── phpmyadmin/     phpMyAdmin (extracted by setup.ps1)
├── packages/       Source ZIPs (you provide these)
├── templates/      Config templates used by setup.ps1
├── www/            Your web projects go here
├── logs/           Stack-level logs
├── setup.ps1       One-shot setup script
├── start-stack.bat Launch all services (CLI)
└── stop-stack.bat  Stop all services (CLI)
```

Each project lives in its own subfolder under `www/` and is accessible at `http://localhost/<project-name>`.

---

## 🔧 Common Tasks

### phpMyAdmin

URL: [http://localhost/phpmyadmin](http://localhost/phpmyadmin)  
Default login: `root` / *(no password)*

### Switch PHP version

Open the app → **PHP Versions** tab → click the version you want. Apache restarts automatically.

Or use the CLI:

```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1 -PhpVersion php-8.5.7-Win32-vs17-x64
```

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
2. Add your PHP files
3. Visit `http://localhost/my-project`

### Stop the stack

Click **Stop All** in the app, or run `stop-stack.bat`.

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
- Default MySQL credentials: `root` / *(no password)*
- Ports: Apache on **80**, MySQL on **3306** (configurable in the app Settings)
- Port conflicts: ensure nothing else is using those ports before starting

---

## 🔍 Troubleshooting

**Port already in use**  
Check with `netstat -ano | findstr :80` and kill the conflicting process, or change the port in the app Settings.

**setup.ps1 blocked by execution policy**  
Run: `powershell -ExecutionPolicy Bypass -File setup.ps1`

**MySQL won't start**  
Check `mysql\<version>\data\*.err` for the error log — visible in the app under **Activity Log → MySQL Error Log**.

**Permission errors on symlink creation**  
Run the script from an elevated (Administrator) PowerShell prompt.

**Electron app won't start / "failed to install correctly"**  
Delete `app/node_modules/electron` and run `npm install` again. See [`app/BUILD.md`](app/BUILD.md) for the mirror workaround.

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
- [Electron Documentation](https://www.electronjs.org/docs/latest)

---

## 📄 License

[MIT License](LICENSE)
