## 🔧 Setup Instructions (Manual for Now)

1. Clone this repo:

2. Download & extract:
- [Apache for Windows](https://www.apachelounge.com/download/)
- [PHP for Windows](https://windows.php.net/download/)
- [MySQL ZIP Archive](https://dev.mysql.com/downloads/mysql/)
- [phpMyAdmin](https://www.phpmyadmin.net/downloads/)

3. Place them into the respective folders:
/apache/
/php/
/mysql/
/phpmyadmin/


4. Update paths in:
- `apache/conf/httpd.conf` → `PHPIniDir`, `LoadModule`, `DocumentRoot`
- `php/php.ini` → enable extensions like `openssl`, `mysqli`, `mbstring`
- `mysql/my.ini` → define datadir, port, socket

5. Run `start-stack.bat` — open browser at http://localhost
