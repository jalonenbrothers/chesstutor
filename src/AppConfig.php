<?php
declare(strict_types=1);

final class AppConfig
{
    private const CONFIG_FILE = __DIR__ . '/../config/config.php';
    private const LEGACY_ENV_FILE = __DIR__ . '/../config/.env';

    private static ?array $values = null;
    private static ?array $legacy = null;

    public static function openrouter(): array
    {
        return [
            'api_key' => self::pick('OPENROUTER_API_KEY', ['openrouter', 'api_key'], 'OPENROUTER_API_KEY'),
            'model' => self::pick('OPENROUTER_MODEL', ['openrouter', 'model'], 'OPENROUTER_MODEL'),
        ];
    }

    public static function db(): array
    {
        $db = self::path(['db']);
        return [
            'host' => self::pick('MYSQL_HOST', ['db', 'host']) ?: 'chesstutor-db',
            'port' => (int)(self::pick('MYSQL_PORT', ['db', 'port']) ?: (is_array($db) ? ($db['port'] ?? 3306) : 3306)),
            'name' => self::pick('MYSQL_DATABASE', ['db', 'name']) ?: 'chesstutordb',
            'user' => self::pick('MYSQL_USER', ['db', 'user']) ?: 'chesstutor',
            'password' => self::pick('MYSQL_PASSWORD', ['db', 'password']),
        ];
    }

    public static function environment(): string
    {
        return self::pick('APP_ENV', ['app', 'env']) ?: 'production';
    }

    private static function pick(string $envVar, array $path, string $legacyKey = ''): string
    {
        $env = getenv($envVar);
        if (is_string($env) && $env !== '') {
            return $env;
        }
        $value = self::path($path);
        if (is_scalar($value) && (string)$value !== '') {
            return (string)$value;
        }
        if ($legacyKey !== '') {
            $legacy = self::legacy();
            $value = $legacy[$legacyKey] ?? '';
            if (is_string($value)) {
                return $value;
            }
        }
        return '';
    }

    private static function path(array $path): mixed
    {
        $scope = self::all();
        foreach ($path as $part) {
            if (!is_array($scope) || !array_key_exists($part, $scope)) {
                return null;
            }
            $scope = $scope[$part];
        }
        return $scope;
    }

    private static function all(): array
    {
        if (self::$values === null) {
            $loaded = is_file(self::CONFIG_FILE) ? require self::CONFIG_FILE : [];
            self::$values = is_array($loaded) ? $loaded : [];
        }
        return self::$values;
    }

    private static function legacy(): array
    {
        if (self::$legacy === null) {
            self::$legacy = is_file(self::LEGACY_ENV_FILE)
                ? (parse_ini_file(self::LEGACY_ENV_FILE, false, INI_SCANNER_RAW) ?: [])
                : [];
        }
        return self::$legacy;
    }
}
