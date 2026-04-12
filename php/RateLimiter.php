<?php

declare(strict_types=1);

class RateLimiter
{
    private string $storePath;
    private int $maxRequests;
    private int $windowSeconds;

    public function __construct(
        string $storePath = __DIR__ . '/../.rate_limit',
        int $maxRequests = 100,
        int $windowSeconds = 60
    ) {
        $this->storePath = $storePath;
        $this->maxRequests = $maxRequests;
        $this->windowSeconds = $windowSeconds;

        if (!is_dir($this->storePath)) {
            mkdir($this->storePath, 0755, true);
        }
    }

    public function isAllowed(string $identifier): bool
    {
        $file = $this->storePath . '/' . hash('sha256', $identifier) . '.json';
        $now = time();

        $data = [
            'count' => 0,
            'reset_at' => $now + $this->windowSeconds
        ];

        if (is_file($file)) {
            $stored = json_decode((string) file_get_contents($file), true);
            if (is_array($stored)) {
                $data = $stored;
            }
        }

        if ($now >= ($data['reset_at'] ?? 0)) {
            $data['count'] = 0;
            $data['reset_at'] = $now + $this->windowSeconds;
        }

        if (($data['count'] ?? 0) >= $this->maxRequests) {
            return false;
        }

        $data['count'] = ($data['count'] ?? 0) + 1;
        file_put_contents($file, json_encode($data));

        if (rand(0, 99) === 0) {
            $this->cleanup();
        }

        return true;
    }

    private function cleanup(): void
    {
        $now = time();
        $files = glob($this->storePath . '/*.json');

        if (!is_array($files)) {
            return;
        }

        foreach ($files as $file) {
            $data = json_decode((string) file_get_contents($file), true);
            if (is_array($data) && ($data['reset_at'] ?? 0) < $now) {
                @unlink($file);
            }
        }
    }
}

