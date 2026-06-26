<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\SocialConnection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SocialController extends Controller
{
    /**
     * Get all connected social accounts for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $connections = SocialConnection::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (SocialConnection $c) => [
                'id' => $c->id,
                'provider' => $c->provider,
                'provider_account_id' => $c->provider_account_id,
                'name' => $c->name,
                'metadata' => $c->metadata,
                'is_expired' => $c->isExpired(),
                'created_at' => $c->created_at->toISOString(),
            ]);

        return response()->json([
            'connections' => $connections,
        ]);
    }

    /**
     * Redirect user to Facebook OAuth dialog.
     */
    public function connectFacebook(Request $request): JsonResponse
    {
        $appId = config('services.facebook.client_id');
        $redirectUri = config('services.facebook.redirect');

        $scopes = [
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_posts',
            'instagram_basic',
            'instagram_manage_insights',
            'instagram_manage_messages',
        ];

        $state = bin2hex(random_bytes(16));

        // Store state in session to verify on callback
        session(['facebook_oauth_state' => $state]);
        session(['facebook_oauth_user_id' => $request->user()->id]);

        $url = 'https://www.facebook.com/v25.0/dialog/oauth?' . http_build_query([
            'client_id' => $appId,
            'redirect_uri' => $redirectUri,
            'state' => $state,
            'scope' => implode(',', $scopes),
            'response_type' => 'code',
        ]);

        return response()->json(['redirect_url' => $url]);
    }

    /**
     * Handle Facebook OAuth callback (GET redirect from Facebook).
     */
    public function callbackFacebook(Request $request): JsonResponse
    {
        // Facebook redirects via GET with query params — read them directly
        $code = $request->query('code');
        $state = $request->query('state');
        $error = $request->query('error');
        $errorDescription = $request->query('error_description');

        if (!$code && !$error) {
            return response()->json(['message' => 'Missing authorization code.'], 400);
        }

        // Check if user denied authorization
        if ($error) {
            return response()->json([
                'message' => $errorDescription ?? 'Authorization was denied.',
            ], 400);
        }

        // Verify state matches
        $storedState = session()->pull('facebook_oauth_state');
        $userId = session()->pull('facebook_oauth_user_id');

        if (!$storedState || !$userId || $state !== $storedState) {
            return response()->json(['message' => 'Invalid state parameter. Possible CSRF attack.'], 400);
        }

        $appId = config('services.facebook.client_id');
        $appSecret = config('services.facebook.client_secret');
        $redirectUri = config('services.facebook.redirect');

        // Exchange code for short-lived access token
        $tokenResponse = Http::get('https://graph.facebook.com/v25.0/oauth/access_token', [
            'client_id' => $appId,
            'redirect_uri' => $redirectUri,
            'client_secret' => $appSecret,
            'code' => $request->code,
        ]);

        if ($tokenResponse->failed()) {
            return response()->json([
                'message' => 'Failed to exchange authorization code for access token.',
                'error' => $tokenResponse->json(),
            ], 400);
        }

        $shortLivedToken = $tokenResponse->json('access_token');

        // Exchange for long-lived token
        $longLivedResponse = Http::get('https://graph.facebook.com/v25.0/oauth/access_token', [
            'grant_type' => 'fb_exchange_token',
            'client_id' => $appId,
            'client_secret' => $appSecret,
            'fb_exchange_token' => $shortLivedToken,
        ]);

        if ($longLivedResponse->failed()) {
            return response()->json([
                'message' => 'Failed to extend access token.',
                'error' => $longLivedResponse->json(),
            ], 400);
        }

        $longLivedUserToken = $longLivedResponse->json('access_token');
        $expiresIn = $longLivedResponse->json('expires_in'); // Typically ~60 days in seconds

        // Get user's Facebook Pages
        $pagesResponse = Http::get('https://graph.facebook.com/v25.0/me/accounts', [
            'access_token' => $longLivedUserToken,
        ]);

        if ($pagesResponse->failed()) {
            return response()->json([
                'message' => 'Failed to fetch Facebook Pages.',
                'error' => $pagesResponse->json(),
            ], 400);
        }

        $pages = $pagesResponse->json('data', []);
        $savedConnections = [];

        foreach ($pages as $page) {
            $pageId = $page['id'];
            $pageToken = $page['access_token'];
            $pageName = $page['name'];

            // Save or update Facebook Page connection
            $connection = SocialConnection::updateOrCreate(
                [
                    'user_id' => $userId,
                    'provider' => 'facebook_page',
                    'provider_account_id' => $pageId,
                ],
                [
                    'name' => $pageName,
                    'access_token' => $pageToken,
                    'refresh_token' => $longLivedUserToken,
                    'token_expires_at' => $expiresIn ? now()->addSeconds((int) $expiresIn) : null,
                    'metadata' => [
                        'category' => $page['category'] ?? null,
                        'profile_pic' => $page['picture'] ?? null,
                    ],
                ]
            );

            $savedConnections[] = [
                'id' => $connection->id,
                'provider' => 'facebook_page',
                'name' => $pageName,
                'provider_account_id' => $pageId,
            ];

            // Try to find linked Instagram Business Account
            try {
                $igResponse = Http::get("https://graph.facebook.com/v25.0/{$pageId}/instagram_accounts", [
                    'access_token' => $pageToken,
                ]);

                if ($igResponse->successful()) {
                    $igAccounts = $igResponse->json('data', []);

                    foreach ($igAccounts as $igAccount) {
                        $igId = $igAccount['id'];
                        $igUsername = $igAccount['username'];

                        $igConnection = SocialConnection::updateOrCreate(
                            [
                                'user_id' => $userId,
                                'provider' => 'instagram_business',
                                'provider_account_id' => $igId,
                            ],
                            [
                                'name' => $igUsername,
                                'access_token' => $pageToken, // Instagram uses the Page token
                                'refresh_token' => $longLivedUserToken,
                                'token_expires_at' => $expiresIn ? now()->addSeconds((int) $expiresIn) : null,
                                'metadata' => [
                                    'profile_pic' => $igAccount['profile_pic'] ?? null,
                                    'facebook_page_id' => $pageId,
                                    'facebook_page_name' => $pageName,
                                ],
                            ]
                        );

                        $savedConnections[] = [
                            'id' => $igConnection->id,
                            'provider' => 'instagram_business',
                            'name' => $igUsername,
                            'provider_account_id' => $igId,
                        ];
                    }
                }
            } catch (\Exception $e) {
                // Instagram account may not be linked — that's okay
                // Log unexpected errors for debugging
                if (!str_contains($e->getMessage(), 'Instagram')) {
                    logger()->warning('Failed to fetch Instagram account for page ' . $pageId . ': ' . $e->getMessage());
                }
            }
        }

        // Log activity as the user who initiated the connection
        $user = \App\Models\User::find($userId);
        if ($user) {
            ActivityLog::log(
                $user,
                'social_connected',
                'Connected social accounts: ' . collect($savedConnections)->pluck('name')->implode(', ')
            );
        }

        return response()->json([
            'message' => 'Social accounts connected successfully.',
            'connections' => $savedConnections,
        ]);
    }

    /**
     * Disconnect a social account.
     */
    public function disconnect(Request $request, SocialConnection $connection): JsonResponse
    {
        abort_unless($connection->user_id === $request->user()->id, 403);

        $name = $connection->name;
        $provider = $connection->provider;

        $connection->delete();

        ActivityLog::log(
            $request->user(),
            'social_disconnected',
            "Disconnected {$provider}: {$name}"
        );

        return response()->json([
            'message' => "{$name} disconnected successfully.",
        ]);
    }
}
