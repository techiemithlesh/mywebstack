# MyWebStack

A lightweight, portable web development stack for Windows with Apache, PHP, MySQL, and phpMyAdmin.

## 🚀 Quick Start Guide

### 1. Clone the Repository

```bash
git clone https://github.com/techiemithlesh/mywebstack.git
cd mywebstack
```

### 2. Download Required Components

Download and extract the following components:

- [Apache for Windows](https://www.apachelounge.com/download/)
- [PHP for Windows](https://windows.php.net/download/)
- [MySQL ZIP Archive](https://dev.mysql.com/downloads/mysql/)
- [(Optional) phpMyAdmin](https://www.phpmyadmin.net/downloads/)

### 3. Setup Directory Structure

Place the extracted components in the following directories:

```
mywebstack/
├── apache/         # Apache files (Apache24 folder)
├── php/            # PHP files
├── mysql/          # MySQL files
├── phpmyadmin/     # phpMyAdmin files (optional)
├── www/            # Your web projects go here
├── templates/      # Configuration templates
├── start-stack.bat # Script to start the stack
└── stop-stack.bat  # Script to stop the stack
```

### 4. Configure the Stack

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
└── ...
```

## 🔧 Common Tasks

### Accessing phpMyAdmin

If installed, phpMyAdmin is available at [http://localhost/phpmyadmin](http://localhost/phpmyadmin)

### Creating a New Database

1. Open phpMyAdmin
2. Click "New" in the left sidebar
3. Enter a database name and click "Create"

### Adding a New Project

1. Create a new folder in the `www/` directory
2. Copy the `.htaccess` file from `templates/` into your project folder
3. Add your PHP files to the project folder
4. Access your project at `http://localhost/your-project-folder`

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
