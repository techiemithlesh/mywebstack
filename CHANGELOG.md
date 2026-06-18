# Changelog

All notable changes to MyWebStack will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

_Changes on the `development` branch not yet in a release._

### Added
### Changed
### Fixed
### Removed

---

## [0.1.1] – 2025-06-01

### Added
- Pre-bundled ZIP release (Apache + PHP + MySQL + phpMyAdmin, zero config)
- `setup.ps1` automated setup with dynamic path detection
- `start-stack.bat` / `stop-stack.bat` for one-click service control
- `start-stack.ps1` service launcher with process health checks
- Configuration templates under `templates/`
- `MYWEBSTACK_HOME` environment variable and PATH setup
- phpMyAdmin blank-password login enabled automatically
- MySQL data directory initialised by setup if missing
- `www/` as the document root — each subfolder is a project

### Changed
- Upgraded MySQL to 8.4
- Upgraded PHP to 8.5.7

---

## [0.1.0] – 2025-05-01

### Added
- Initial release
- Apache 2.4, PHP 7.4, MySQL 8.0, phpMyAdmin 5.2.1
- Basic README with setup instructions

[Unreleased]: https://github.com/techiemithlesh/mywebstack/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/techiemithlesh/mywebstack/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/techiemithlesh/mywebstack/releases/tag/v0.1.0
