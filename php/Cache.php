<?php

declare(strict_types=1);

class Cache
{
    private string $cacheDir;
    private int $defaultTTL;

    public function __construct(
        string $cacheDir = __DIR__ . '/../.cache',
        int $defaultTTL = 300
    ) {
        $this->cacheDir = $cacheDir;
        $this->defaultTTL = $defaultTTL;

        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }

    public function get(string $key): ?array
    {
        $file = $this->getFilePath($key);

        if (!is_file($file)) {
            return null;
        }

        $data = json_decode((string) file_get_contents($file), true);

        if (!is_array($data) || empty($data)) {
            return null;
        }

        if (time() > ($data['expires_at'] ?? 0)) {
            @unlink($file);
            return null;
        }

        return isset($data['value']) && is_array($data['value']) ? $data['value'] : null;
    }

    public function set(string $key, array $value, ?int $ttl = null): void
    {
        $ttl = $ttl ?? $this->defaultTTL;
        $file = $this->getFilePath($key);

        $data = [
            'value' => $value,
            'expires_at' => time() + $ttl
        ];

        file_put_contents($file, json_encode($data));
    }

    public function clear(): void
    {
        $files = glob($this->cacheDir . '/*.json');

        if (!is_array($files)) {
            return;
        }

        foreach ($files as $file) {
            @unlink($file);
        }
    }

    private function getFilePath(string $key): string
    {
        return $this->cacheDir . '/' . hash('sha256', $key) . '.json';
    }
}

