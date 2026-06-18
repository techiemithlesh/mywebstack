<?php
declare(strict_types=1);

if (isset($_GET['phpinfo'])) {
    phpinfo();
    exit;
}

$root = dirname(__DIR__);
$wwwRoot = __DIR__;

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function firstMatch(string $pattern): ?string
{
    $matches = glob($pattern, GLOB_NOSORT);
    if (!$matches) {
        return null;
    }

    sort($matches, SORT_NATURAL | SORT_FLAG_CASE);
    return $matches[0];
}

function fileVersion(?string $path): string
{
    if (!$path || !is_file($path)) {
        return 'Not found';
    }

    if (!function_exists('shell_exec')) {
        return 'Installed';
    }

    $version = trim((string) @shell_exec('"' . $path . '" -v 2>&1'));
    if ($version === '') {
        return 'Installed';
    }

    $line = strtok($version, PHP_EOL);
    return $line !== false ? $line : $version;
}

function iniValue(string $key): string
{
    $value = ini_get($key);
    return $value === false || $value === '' ? 'Not set' : $value;
}

$apacheExe = firstMatch($root . '/apache/*/bin/httpd.exe');
$mysqlExe = firstMatch($root . '/mysql/*/bin/mysqld.exe');
$phpIni = php_ini_loaded_file() ?: 'Not loaded';

$projects = array_values(array_filter(scandir($wwwRoot) ?: [], static function (string $item) use ($wwwRoot): bool {
    if ($item[0] === '.' || $item === 'index.php') {
        return false;
    }

    return is_dir($wwwRoot . DIRECTORY_SEPARATOR . $item);
}));

$cards = [
    ['label' => 'PHP', 'value' => PHP_VERSION, 'detail' => PHP_SAPI],
    ['label' => 'Apache', 'value' => function_exists('apache_get_version') ? apache_get_version() : fileVersion($apacheExe), 'detail' => $apacheExe ? basename(dirname(dirname($apacheExe))) : 'Not found'],
    ['label' => 'MySQL', 'value' => fileVersion($mysqlExe), 'detail' => $mysqlExe ? basename(dirname(dirname($mysqlExe))) : 'Not found'],
    ['label' => 'phpMyAdmin', 'value' => is_dir($wwwRoot . '/phpmyadmin') ? 'Ready' : 'Not linked', 'detail' => '/phpmyadmin'],
];

$limits = [
    'Upload max filesize' => iniValue('upload_max_filesize'),
    'POST max size' => iniValue('post_max_size'),
    'Memory limit' => iniValue('memory_limit'),
    'Max execution time' => iniValue('max_execution_time') . 's',
    'Loaded php.ini' => $phpIni,
];
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>MyWebStack Dashboard</title>
    <style>
        :root {
            color-scheme: light;
            --bg: #f5f7fb;
            --panel: #ffffff;
            --ink: #172033;
            --muted: #667085;
            --line: #d9e1ec;
            --blue: #2563eb;
            --green: #0f8f6f;
            --amber: #b7791f;
            --rose: #be3455;
            --shadow: 0 18px 55px rgba(28, 39, 64, .12);
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background:
                radial-gradient(circle at top left, rgba(37, 99, 235, .12), transparent 30rem),
                linear-gradient(135deg, #f7fafc 0%, #eef4f8 48%, #f9fbf5 100%);
            color: var(--ink);
        }

        a {
            color: inherit;
            text-decoration: none;
        }

        .shell {
            width: min(1180px, calc(100% - 32px));
            margin: 0 auto;
            padding: 32px 0;
        }

        .topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 28px;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
        }

        .mark {
            display: grid;
            place-items: center;
            width: 48px;
            height: 48px;
            border-radius: 8px;
            background: #172033;
            color: #fff;
            font-weight: 800;
            letter-spacing: 0;
            box-shadow: var(--shadow);
        }

        .brand h1 {
            margin: 0;
            font-size: clamp(1.45rem, 2.5vw, 2.25rem);
            line-height: 1.05;
        }

        .brand p {
            margin: 6px 0 0;
            color: var(--muted);
        }

        .actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 10px;
        }

        .button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            min-height: 42px;
            padding: 0 14px;
            border: 1px solid var(--line);
            border-radius: 8px;
            background: rgba(255, 255, 255, .82);
            font-weight: 700;
            color: #22304a;
        }

        .button.primary {
            background: var(--blue);
            border-color: var(--blue);
            color: #fff;
        }

        .hero {
            display: grid;
            grid-template-columns: minmax(0, 1.25fr) minmax(300px, .75fr);
            gap: 20px;
            align-items: stretch;
            margin-bottom: 20px;
        }

        .panel {
            border: 1px solid rgba(217, 225, 236, .85);
            border-radius: 8px;
            background: rgba(255, 255, 255, .9);
            box-shadow: var(--shadow);
        }

        .intro {
            padding: clamp(24px, 4vw, 42px);
            overflow: hidden;
            position: relative;
        }

        .intro::after {
            content: "";
            position: absolute;
            right: 28px;
            bottom: 22px;
            width: 190px;
            height: 190px;
            border: 1px solid rgba(37, 99, 235, .18);
            border-radius: 8px;
            transform: rotate(8deg);
            pointer-events: none;
        }

        .eyebrow {
            display: inline-flex;
            align-items: center;
            min-height: 30px;
            padding: 0 10px;
            border-radius: 999px;
            background: rgba(15, 143, 111, .1);
            color: var(--green);
            font-weight: 800;
            font-size: .78rem;
            text-transform: uppercase;
            letter-spacing: .08em;
        }

        .intro h2 {
            max-width: 760px;
            margin: 18px 0 14px;
            font-size: clamp(2.15rem, 5vw, 4.8rem);
            line-height: .96;
            letter-spacing: 0;
        }

        .intro p {
            max-width: 690px;
            margin: 0;
            color: var(--muted);
            font-size: 1.05rem;
            line-height: 1.7;
        }

        .credit {
            display: grid;
            align-content: space-between;
            gap: 24px;
            padding: 24px;
            background: #172033;
            color: #fff;
            min-height: 280px;
        }

        .credit span {
            color: #a9b7d0;
            font-size: .82rem;
            font-weight: 800;
            letter-spacing: .08em;
            text-transform: uppercase;
        }

        .credit strong {
            display: block;
            margin-top: 8px;
            font-size: clamp(1.65rem, 3vw, 2.4rem);
            line-height: 1.05;
        }

        .credit p {
            margin: 0;
            color: #d7dfeb;
            line-height: 1.65;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 20px;
        }

        .stat {
            padding: 18px;
            min-height: 150px;
        }

        .stat .label {
            color: var(--muted);
            font-size: .82rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .08em;
        }

        .stat .value {
            margin-top: 16px;
            font-size: 1.16rem;
            font-weight: 850;
            line-height: 1.25;
            overflow-wrap: anywhere;
        }

        .stat .detail {
            margin-top: 10px;
            color: var(--muted);
            font-size: .92rem;
            overflow-wrap: anywhere;
        }

        .lower {
            display: grid;
            grid-template-columns: minmax(0, .95fr) minmax(0, 1.05fr);
            gap: 20px;
        }

        .section {
            padding: 22px;
        }

        .section h3 {
            margin: 0 0 16px;
            font-size: 1.1rem;
        }

        .list {
            display: grid;
            gap: 10px;
        }

        .row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 0;
            border-top: 1px solid var(--line);
        }

        .row:first-child {
            border-top: 0;
            padding-top: 0;
        }

        .row span {
            color: var(--muted);
        }

        .row strong {
            text-align: right;
            overflow-wrap: anywhere;
        }

        .project-list {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
        }

        .project {
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 54px;
            padding: 12px 14px;
            border: 1px solid var(--line);
            border-radius: 8px;
            background: #fbfcff;
            font-weight: 750;
        }

        .project small {
            color: var(--muted);
            font-weight: 700;
        }

        .empty {
            padding: 14px;
            border: 1px dashed var(--line);
            border-radius: 8px;
            color: var(--muted);
        }

        footer {
            margin-top: 22px;
            color: var(--muted);
            text-align: center;
            font-size: .92rem;
        }

        @media (max-width: 880px) {
            .topbar,
            .hero,
            .lower {
                grid-template-columns: 1fr;
            }

            .topbar {
                display: grid;
            }

            .actions {
                justify-content: flex-start;
            }

            .grid,
            .project-list {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }

        @media (max-width: 560px) {
            .shell {
                width: min(100% - 20px, 1180px);
                padding: 18px 0;
            }

            .brand {
                align-items: flex-start;
            }

            .mark {
                width: 42px;
                height: 42px;
            }

            .grid,
            .project-list {
                grid-template-columns: 1fr;
            }

            .row {
                display: grid;
            }

            .row strong {
                text-align: left;
            }
        }
    </style>
</head>
<body>
    <main class="shell">
        <header class="topbar">
            <div class="brand">
                <div class="mark" aria-hidden="true">MW</div>
                <div>
                    <h1>MyWebStack</h1>
                    <p>Portable Windows stack for Apache, PHP, MySQL, and phpMyAdmin.</p>
                </div>
            </div>
            <nav class="actions" aria-label="Quick links">
                <a class="button primary" href="/phpmyadmin/">Open phpMyAdmin</a>
                <a class="button" href="/?phpinfo=1">PHP info</a>
            </nav>
        </header>

        <section class="hero">
            <div class="panel intro">
                <span class="eyebrow">Local server running</span>
                <h2>Your development stack is ready.</h2>
                <p>Use this dashboard to jump into projects, confirm runtime versions, and check the PHP limits that matter for imports and uploads.</p>
            </div>

            <aside class="panel credit">
                <div>
                    <span>Created and maintained by</span>
                    <strong>Mithlesh Patel</strong>
                </div>
                <p>Built as a simple release-ready local stack with clean defaults, phpMyAdmin access, and practical PHP settings for everyday development.</p>
            </aside>
        </section>

        <section class="grid" aria-label="Stack status">
            <?php foreach ($cards as $card): ?>
                <article class="panel stat">
                    <div class="label"><?= e($card['label']) ?></div>
                    <div class="value"><?= e($card['value']) ?></div>
                    <div class="detail"><?= e($card['detail']) ?></div>
                </article>
            <?php endforeach; ?>
        </section>

        <section class="lower">
            <div class="panel section">
                <h3>PHP Configuration</h3>
                <div class="list">
                    <?php foreach ($limits as $label => $value): ?>
                        <div class="row">
                            <span><?= e($label) ?></span>
                            <strong><?= e($value) ?></strong>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <div class="panel section">
                <h3>Projects</h3>
                <?php if ($projects): ?>
                    <div class="project-list">
                        <?php foreach ($projects as $project): ?>
                            <a class="project" href="/<?= e(rawurlencode($project)) ?>/">
                                <span><?= e($project) ?></span>
                                <small>Open</small>
                            </a>
                        <?php endforeach; ?>
                    </div>
                <?php else: ?>
                    <div class="empty">Place project folders inside www and they will appear here.</div>
                <?php endif; ?>
            </div>
        </section>

        <footer>
            MyWebStack dashboard served from <?= e($wwwRoot) ?>
        </footer>
    </main>
</body>
</html>
