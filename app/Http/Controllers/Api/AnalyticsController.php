<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SocialConnection;
use App\Models\ScheduleEntry;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class AnalyticsController extends Controller
{
    private const CACHE_TTL = 300; // 5 minutes per metric group
    private const MAX_DAYS = 90;

    /**
     * Get analytics for the authenticated user's connected accounts.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'connection_id' => 'nullable|exists:social_connections,id',
            'platform' => 'nullable|in:facebook,instagram',
            'days' => 'nullable|integer|min:1|max:90',
        ]);

        $user = $request->user();
        $days = min((int) ($request->days ?? 28), self::MAX_DAYS);

        // Cache busting for explicit refresh
        $forceRefresh = $request->boolean('refresh');

        $connections = SocialConnection::where('user_id', $user->id);

        if ($request->filled('connection_id')) {
            $connections->where('id', $request->connection_id);
        }
        if ($request->filled('platform')) {
            $provider = $request->platform === 'facebook' ? 'facebook_page' : 'instagram_business';
            $connections->where('provider', $provider);
        }

        $connections = $connections->get();

        $metrics = [];
        $cachedAt = null;

        foreach ($connections as $connection) {
            $data = $this->fetchMetricsCached($connection, $days, $forceRefresh);

            $metrics[] = [
                'connection_id' => $connection->id,
                'name' => $connection->name,
                'platform' => $connection->isFacebook() ? 'facebook' : 'instagram',
                'is_expired' => $connection->isExpired(),
                'data' => $data,
            ];

            if (!$cachedAt) {
                $cachedAt = now()->toIso8601String();
            }
        }

        // Aggregate stats across all accounts
        $aggregated = $this->aggregateMetrics($metrics);

        // Publishing stats from local DB
        $publishingStats = [
            'total_scheduled' => ScheduleEntry::where('user_id', $user->id)->count(),
            'total_published' => ScheduleEntry::where('user_id', $user->id)->where('status', 'published')->count(),
            'total_failed' => ScheduleEntry::where('user_id', $user->id)->where('status', 'failed')->count(),
            'by_platform' => [
                'facebook' => ScheduleEntry::where('user_id', $user->id)->where('platform', 'facebook')->count(),
                'instagram' => ScheduleEntry::where('user_id', $user->id)->where('platform', 'instagram')->count(),
            ],
        ];

        return response()->json([
            'metrics' => $metrics,
            'aggregated' => $aggregated,
            'publishing_stats' => $publishingStats,
            'cached_at' => $cachedAt,
            'days' => $days,
        ]);
    }

    /**
     * Get system-wide analytics (admin only).
     */
    public function admin(Request $request): JsonResponse
    {
        $cacheKey = 'analytics:admin:aggregate';
        $data = Cache::remember($cacheKey, self::CACHE_TTL, function () {
            $totalConnections = SocialConnection::count();
            $activeConnections = SocialConnection::where(function ($q) {
                $q->whereNull('token_expires_at')
                    ->orWhere('token_expires_at', '>', now());
            })->count();

            $totalScheduled = ScheduleEntry::count();
            $totalPublished = ScheduleEntry::where('status', 'published')->count();
            $totalFailed = ScheduleEntry::where('status', 'failed')->count();

            $topAccounts = SocialConnection::withCount('scheduleEntries')
                ->orderBy('schedule_entries_count', 'desc')
                ->take(5)
                ->get()
                ->map(fn ($c) => [
                    'name' => $c->name,
                    'provider' => $c->isFacebook() ? 'facebook' : 'instagram',
                    'total_posts' => $c->schedule_entries_count,
                ]);

            $usersWithConnections = User::has('socialConnections')->count();

            return [
                'total_connections' => $totalConnections,
                'active_connections' => $activeConnections,
                'total_scheduled' => $totalScheduled,
                'total_published' => $totalPublished,
                'total_failed' => $totalFailed,
                'users_with_connections' => $usersWithConnections,
                'top_accounts' => $topAccounts,
            ];
        });

        return response()->json([
            'data' => $data,
            'cached_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Export analytics as CSV.
     */
    public function export(Request $request): \Illuminate\Http\Response
    {
        $request->validate([
            'connection_id' => 'nullable|exists:social_connections,id',
            'days' => 'nullable|integer|min:1|max:90',
        ]);

        $user = $request->user();
        $days = min((int) ($request->days ?? 28), self::MAX_DAYS);

        $connections = SocialConnection::where('user_id', $user->id);
        if ($request->filled('connection_id')) {
            $connections->where('id', $request->connection_id);
        }
        $connections = $connections->get();

        $csv = [];

        // Header
        $csv[] = ['Account', 'Platform', 'Metric', 'Value', 'Period', 'Exported At'];

        foreach ($connections as $connection) {
            $metrics = $this->fetchMetricsCached($connection, $days);

            foreach ($metrics as $label => $value) {
                $csv[] = [
                    $connection->name,
                    $connection->isFacebook() ? 'facebook' : 'instagram',
                    $label,
                    $value,
                    "Last {$days} days",
                    now()->toIso8601String(),
                ];
            }
        }

        if (count($csv) <= 1) {
            return response('No analytics data available for export.', 404);
        }

        // Build CSV string
        $output = fopen('php://temp', 'r+');
        foreach ($csv as $row) {
            fputcsv($output, $row);
        }
        rewind($output);
        $content = stream_get_contents($output);
        fclose($output);

        return response($content, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="analytics-export.csv"',
        ]);
    }

    /**
     * Fetch metrics with caching (used by both index and export).
     */
    private function fetchMetricsCached(SocialConnection $connection, int $days, bool $forceRefresh = false): array
    {
        $key = "analytics:{$connection->id}:{$days}";

        if ($forceRefresh) {
            Cache::forget($key);
        }

        return Cache::remember($key, self::CACHE_TTL, function () use ($connection, $days) {
            return $this->fetchMetrics($connection, $days);
        });
    }

    /**
     * Fetch metrics from Facebook/Instagram Graph API with error handling.
     */
    private function fetchMetrics(SocialConnection $connection, int $days): array
    {
        if ($connection->isExpired()) {
            return [
                'error' => 'Token expired. Reconnect this account.',
                'followers' => null,
                'engagement' => null,
                'impressions' => null,
                'reach' => null,
            ];
        }

        $since = now()->subDays($days)->startOfDay()->timestamp;
        $until = now()->endOfDay()->timestamp;

        try {
            return $connection->isFacebook()
                ? $this->fetchFacebookMetrics($connection, $since, $until)
                : $this->fetchInstagramMetrics($connection, $since, $until);
        } catch (\Exception $e) {
            return [
                'error' => $e->getMessage(),
                'followers' => null,
                'engagement' => null,
                'impressions' => null,
                'reach' => null,
            ];
        }
    }

    private function fetchFacebookMetrics(SocialConnection $connection, int $since, int $until): array
    {
        $pageId = $connection->provider_account_id;
        $token = $connection->access_token;

        // Lifetime metrics (page_follows) — separate call with period=lifetime
        $lifetimeResponse = Http::get("https://graph.facebook.com/v25.0/{$pageId}/insights", [
            'metric' => 'page_follows',
            'period' => 'lifetime',
            'since' => $since,
            'until' => $until,
            'access_token' => $token,
        ]);

        $followers = null;
        if ($lifetimeResponse->successful()) {
            $values = $lifetimeResponse->json('data.0.values', []);
            if (!empty($values)) {
                $followers = (int) end($values)['value'];
            }
        }

        // Daily metrics (need period=day for time-series data)
        $dailyResponse = Http::get("https://graph.facebook.com/v25.0/{$pageId}/insights", [
            'metric' => 'page_post_engagements,page_total_media_view_unique',
            'period' => 'day',
            'since' => $since,
            'until' => $until,
            'access_token' => $token,
        ]);

        $engagementTimeline = [];
        $impressionsTimeline = [];

        if ($dailyResponse->successful()) {
            $data = $dailyResponse->json('data', []);
            foreach ($data as $metric) {
                $name = $metric['name'] ?? '';
                $values = $metric['values'] ?? [];

                match ($name) {
                    'page_post_engagements' => $engagementTimeline = array_map(
                        fn($v) => ['date' => $v['end_time'] ?? null, 'value' => (int) ($v['value'] ?? 0)],
                        $values
                    ),
                    'page_total_media_view_unique' => $impressionsTimeline = array_map(
                        fn($v) => ['date' => $v['end_time'] ?? null, 'value' => (int) ($v['value'] ?? 0)],
                        $values
                    ),
                    default => null,
                };
            }
        }

        // Get fan_count from page node (lightweight separate call)
        $pageResponse = Http::get("https://graph.facebook.com/v25.0/{$pageId}", [
            'fields' => 'fan_count',
            'access_token' => $token,
        ]);

        $pageLikes = null;
        if ($pageResponse->successful()) {
            $pageLikes = $pageResponse->json('fan_count');
        }

        $totalEngagement = array_sum(array_column($engagementTimeline, 'value'));
        $totalImpressions = array_sum(array_column($impressionsTimeline, 'value'));

        // Use impressions timeline as reach (page_total_media_view_unique is the recommended metric)
        return [
            'followers' => $followers,
            'page_likes' => $pageLikes,
            'total_engagement' => $totalEngagement,
            'total_impressions' => $totalImpressions,
            'total_reach' => $totalImpressions,
            'engagement_timeline' => $engagementTimeline,
            'impressions_timeline' => $impressionsTimeline,
            'reach_timeline' => $impressionsTimeline,
            'error' => null,
        ];
    }

    private function fetchInstagramMetrics(SocialConnection $connection, int $since, int $until): array
    {
        $igId = $connection->provider_account_id;
        $token = $connection->access_token;

        // Get follower count from IG User endpoint
        $userResponse = Http::get("https://graph.facebook.com/v25.0/{$igId}", [
            'fields' => 'follower_count,username,profile_pic',
            'access_token' => $token,
        ]);

        $followers = null;
        if ($userResponse->successful()) {
            $followers = $userResponse->json('follower_count');
        }

        // Get insights
        $insightsResponse = Http::get("https://graph.facebook.com/v25.0/{$igId}/insights", [
            'metric' => 'reach,views,profile_links_taps',
            'period' => 'day',
            'since' => $since,
            'until' => $until,
            'access_token' => $token,
        ]);

        $reach = [];
        $views = [];
        $profileTaps = [];

        if ($insightsResponse->successful()) {
            $metrics = $insightsResponse->json('data', []);
            foreach ($metrics as $metric) {
                $metricName = $metric['name'];
                $values = $metric['values'] ?? [];

                foreach ($values as $point) {
                    $entry = [
                        'date' => $point['end_time'] ?? null,
                        'value' => (int) ($point['value'] ?? 0),
                    ];

                    match ($metricName) {
                        'reach' => $reach[] = $entry,
                        'views' => $views[] = $entry,
                        'profile_links_taps' => $profileTaps[] = $entry,
                        default => null,
                    };
                }
            }
        }

        $totalReach = array_sum(array_column($reach, 'value'));
        $totalViews = array_sum(array_column($views, 'value'));
        $totalProfileTaps = array_sum(array_column($profileTaps, 'value'));

        return [
            'followers' => $followers,
            'total_reach' => $totalReach,
            'total_views' => $totalViews,
            'total_profile_taps' => $totalProfileTaps,
            'reach_timeline' => $reach,
            'views_timeline' => $views,
            'profile_taps_timeline' => $profileTaps,
            'error' => null,
        ];
    }

    /**
     * Aggregate metrics across multiple connected accounts.
     */
    private function aggregateMetrics(array $metrics): array
    {
        $totalFollowers = 0;
        $totalEngagement = 0;
        $totalImpressions = 0;
        $totalReach = 0;
        $totalViews = 0;
        $accountsWithError = 0;

        foreach ($metrics as $account) {
            $data = $account['data'];

            if ($data['error'] ?? null) {
                $accountsWithError++;
                continue;
            }

            if ($data['followers'] ?? null) {
                $totalFollowers += (int) $data['followers'];
            }
            if ($data['total_engagement'] ?? null) {
                $totalEngagement += (int) $data['total_engagement'];
            }
            if ($data['total_impressions'] ?? null) {
                $totalImpressions += (int) $data['total_impressions'];
            }
            if ($data['total_reach'] ?? null) {
                $totalReach += (int) $data['total_reach'];
            }
            if ($data['total_views'] ?? null) {
                $totalViews += (int) $data['total_views'];
            }
        }

        return [
            'total_followers' => $totalFollowers,
            'total_engagement' => $totalEngagement,
            'total_impressions' => $totalImpressions,
            'total_reach' => $totalReach,
            'total_views' => $totalViews,
            'accounts_with_errors' => $accountsWithError,
        ];
    }
}
