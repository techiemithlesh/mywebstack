# Contributing to MyWebStack

Thanks for helping make MyWebStack better! This guide covers everything you need to go from zero to merged PR.

---

## Table of Contents

- [Branch Strategy](#branch-strategy)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [What to Work On](#what-to-work-on)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Code Style](#code-style)
- [Releasing](#releasing)

---

## Branch Strategy

```
main          ← stable, tagged releases only
development   ← integration branch for all new work
feature/*     ← your working branch (branch off development)
fix/*         ← bug fix branches (branch off development)
```

**Rule:** Never commit directly to `main`. All work goes through `development` first, then a maintainer merges `development → main` for a release.

---

## Getting Started

### Prerequisites

- Windows 10 / 11
- PowerShell 5.1+
- Git
- [Apache for Windows](https://www.apachelounge.com/download/) (Apache24.zip)
- [PHP for Windows](https://windows.php.net/download/) (Thread Safe, x64)
- [MySQL ZIP Archive](https://dev.mysql.com/downloads/mysql/) (Windows x86, 64-bit ZIP)
- [phpMyAdmin](https://www.phpmyadmin.net/downloads/)

### Fork and Clone

```bash
# 1. Fork the repo on GitHub, then:
git clone https://github.com/<your-username>/mywebstack.git
cd mywebstack
git remote add upstream https://github.com/techiemithlesh/mywebstack.git
```

### Set Up Your Stack

```bash
# Switch to development
git checkout development

# Place the downloaded packages under packages/
# packages/
#   Apache24.zip
#   mysql-8.4.zip
#   php-8.5.7-Win32-vs17-x64.zip
#   phpmyadmin/   ← extracted phpMyAdmin folder

# Run setup
powershell -ExecutionPolicy Bypass -File setup.ps1

# Start
start-stack.bat
```

Open http://localhost to verify everything works.

---

## Development Workflow

```bash
# 1. Sync with upstream before starting
git fetch upstream
git checkout development
git merge upstream/development

# 2. Create your branch
git checkout -b feature/my-cool-feature
# or
git checkout -b fix/apache-port-conflict

# 3. Make changes and commit
git add .
git commit -m "feat: add support for custom Apache port"

# 4. Push and open a PR against development
git push origin feature/my-cool-feature
```

Then open a PR on GitHub: **base branch = `development`** (not `main`).

### Commit Message Format

Use the [Conventional Commits](https://www.conventionalcommits.org/) style:

| Prefix    | Use for                                      |
|-----------|----------------------------------------------|
| `feat:`   | New feature                                  |
| `fix:`    | Bug fix                                      |
| `docs:`   | Documentation only                           |
| `chore:`  | Maintenance (version bumps, CI changes, etc) |
| `refactor:` | Code change that is not a fix or feature  |

Examples:
```
feat: add PHP version selector in setup.ps1
fix: stop-stack.bat fails silently when MySQL is not running
docs: add screenshots to README quick start
chore: bump Apache to 2.4.62
```

---

## What to Work On

Check the [Issues tab](https://github.com/techiemithlesh/mywebstack/issues) for things labelled:

- `good first issue` — great starting points
- `help wanted` — maintainers want outside input
- `bug` — confirmed bugs needing a fix
- `enhancement` — approved feature ideas

If you have a new idea, open an issue first before spending time on a PR. This avoids duplicate work and lets us align on scope.

---

## Pull Request Guidelines

- Target `development`, not `main`
- One logical change per PR
- Include a short description of *why* the change is needed
- If you're fixing a bug, reference the issue: `Closes #42`
- Run your changes locally before submitting — CI checks PowerShell syntax, but it can't test Windows-only behaviour in the cloud

### PR Checklist (also in the PR template)

- [ ] Tested locally on Windows
- [ ] `setup.ps1` still works end-to-end
- [ ] `start-stack.bat` / `stop-stack.bat` still work
- [ ] README updated if behaviour changed
- [ ] CHANGELOG entry added under `[Unreleased]`

---

## Code Style

**PowerShell**
- Use `PascalCase` for function names (`Ensure-Folder`, `Expand-Package`)
- Use `$camelCase` for local variables
- Always include `[Parameter(Mandatory = $true)]` on required params
- Prefer `Write-Host "[OK] ..."` / `"[WARNING] ..."` / `"[INFO] ..."` for consistent console output
- Set `$ErrorActionPreference = "Stop"` at the top of scripts

**Batch files**
- Keep them thin wrappers — heavy logic goes in the `.ps1` equivalent
- Always use `@echo off` and `title`

**Templates** (files under `templates/`)
- Use `{{PLACEHOLDER}}` style tokens that `setup.ps1` replaces
- Add a comment at the top noting this file is auto-generated

---

## Releasing

Only maintainers cut releases, but here's the process for reference:

```bash
# 1. Merge development → main via PR (GitHub)
# 2. Pull main locally
git checkout main
git pull origin main

# 3. Tag the release (semver)
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0

# 4. GitHub Actions will draft a Release automatically
#    (or create it manually from the tag on GitHub)
# 5. Attach the pre-bundled ZIP to the Release
# 6. Update the download link in README.md
```

### Version numbering

We follow [Semantic Versioning](https://semver.org/):

- `MAJOR` — breaking change (e.g., drops Windows 7 support)
- `MINOR` — new feature, backwards compatible
- `PATCH` — bug fix

---

## Questions?

Open a [Discussion](https://github.com/techiemithlesh/mywebstack/discussions) or drop a comment on a relevant issue. We're happy to help onboard new contributors.
