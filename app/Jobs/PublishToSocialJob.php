<?php

namespace App\Jobs;

use App\Models\ActivityLog;
use App\Models\ScheduleEntry;
use App\Models\SocialConnection;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;

class PublishToSocialJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 1; // Manual retry via retry_count + re-dispatch

    public $backoff = [30, 120, 300]; // 30s, 2min, 5min exponential backoff

    public function __construct(
        public ScheduleEntry $entry,
    ) {}

    public function handle(): void
    {
        $this->entry->refresh();

        if ($this->entry->status !== 'pending') {
            return;
        }

        // Atomic: mark as processing
        $this->entry->update(['status' => 'processing']);

        $connection = $this->entry->socialConnection;

        if (!$connection) {
            $this->fail('Social connection no longer exists.');
            return;
        }

        if ($connection->isExpired()) {
            $this->fail('Access token has expired. Please reconnect your account.');
            return;
        }

        try {
            $result = match ($this->entry->platform) {
                'facebook' => $this->publishToFacebook($connection),
                'instagram' => $this->publishToInstagram($connection),
                default => throw new \RuntimeException("Unknown platform: {$this->entry->platform}"),
            };

            $this->entry->update([
                'status' => 'published',
                'published_at' => now(),
            ]);

            \App\Models\Notification::notify(
                $this->entry->user,
                'schedule_published',
                "Published to {$this->entry->platform}",
                "Your scheduled post was published to {$this->entry->platform} successfully.",
                ['schedule_entry_id' => $this->entry->id, 'platform' => $this->entry->platform]
            );

            ActivityLog::log(
                $this->entry->user,
                'schedule_published',
                "Published to {$this->entry->platform} successfully."
            );

        } catch (\Exception $e) {
            $retryCount = $this->entry->retry_count + 1;

            if ($retryCount >= 3) {
                // Dead-letter: mark as failed
                $this->entry->update([
                    'status' => 'failed',
                    'failure_reason' => $e->getMessage(),
                    'retry_count' => $retryCount,
                ]);

                \App\Models\Notification::notify(
                    $this->entry->user,
                    'schedule_failed',
                    "Failed to publish to {$this->entry->platform}",
                    "Your scheduled post failed after 3 attempts: {$e->getMessage()}",
                    ['schedule_entry_id' => $this->entry->id, 'platform' => $this->entry->platform, 'error' => $e->getMessage()]
                );

                ActivityLog::log(
                    $this->entry->user,
                    'schedule_failed',
                    "Failed to publish to {$this->entry->platform} after 3 attempts: {$e->getMessage()}"
                );
            } else {
                $this->entry->update([
                    'status' => 'pending',
                    'retry_count' => $retryCount,
                    'failure_reason' => $e->getMessage(),
                ]);

                // Re-dispatch with backoff
                static::dispatch($this->entry)
                    ->delay(now()->addSeconds($this->backoff[$retryCount - 1] ?? 300));
            }

            throw $e; // Let the queue system know it failed
        }
    }

    private function publishToFacebook(SocialConnection $connection): array
    {
        $pageId = $connection->provider_account_id;
        $accessToken = $connection->access_token;
        $content = $this->entry->content;
        $imageUrl = $this->entry->image_url;

        $params = [
            'message' => $content,
            'access_token' => $accessToken,
        ];

        if ($imageUrl) {
            // Photo post
            $params['url'] = $imageUrl;
            $response = Http::post("https://graph.facebook.com/v25.0/{$pageId}/photos", $params);
        } else {
            // Status post (link or text)
            $response = Http::post("https://graph.facebook.com/v25.0/{$pageId}/feed", $params);
        }

        if ($response->failed()) {
            $error = $response->json('error');
            throw new \RuntimeException(
                $error['message'] ?? 'Facebook API request failed.'
            );
        }

        return $response->json();
    }

    private function publishToInstagram(SocialConnection $connection): array
    {
        $igId = $connection->provider_account_id;
        $accessToken = $connection->access_token;
        $content = $this->entry->content;
        $imageUrl = $this->entry->image_url;

        if (!$imageUrl) {
            throw new \RuntimeException('Instagram posts require an image.');
        }

        // Step 1: Create media container
        $containerResponse = Http::post("https://graph.facebook.com/v25.0/{$igId}/media", [
            'image_url' => $imageUrl,
            'caption' => $content,
            'access_token' => $accessToken,
        ]);

        if ($containerResponse->failed()) {
            $error = $containerResponse->json('error');
            throw new \RuntimeException(
                $error['message'] ?? 'Failed to create Instagram media container.'
            );
        }

        $containerId = $containerResponse->json('id');

        // Step 2: Publish the container
        $publishResponse = Http::post("https://graph.facebook.com/v25.0/{$igId}/media_publish", [
            'creation_id' => $containerId,
            'access_token' => $accessToken,
        ]);

        if ($publishResponse->failed()) {
            $error = $publishResponse->json('error');
            throw new \RuntimeException(
                $error['message'] ?? 'Failed to publish Instagram media.'
            );
        }

        return $publishResponse->json();
    }

    private function fail(string $reason): void
    {
        $this->entry->update([
            'status' => 'failed',
            'failure_reason' => $reason,
        ]);

        $this->delete(); // Don't retry
    }
}
