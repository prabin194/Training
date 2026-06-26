<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\TagController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Auth Routes
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/resend-verification-email', [AuthController::class, 'resendVerificationEmail']);
Route::post('/resend-login-otp', [AuthController::class, 'resendLoginOtp']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return new \App\Http\Resources\UserResource($request->user());
    });

    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/password', [ProfileController::class, 'changePassword']);

    // Devices
    Route::get('/devices', [DeviceController::class, 'index']);
    Route::delete('/devices/{deviceLog}', [DeviceController::class, 'destroy']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Activity Logs
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);

    // Review / Workflow (must be BEFORE apiResource to avoid route conflicts)
    Route::get('/posts/review/pending', [ReviewController::class, 'pendingReviews']);
    Route::post('/posts/{post}/submit-review', [ReviewController::class, 'submitForReview']);
    Route::post('/posts/{post}/approve', [ReviewController::class, 'approve']);
    Route::post('/posts/{post}/reject', [ReviewController::class, 'reject']);
    Route::post('/posts/{post}/publish', [ReviewController::class, 'publish']);
    Route::get('/posts/{post}/transitions', [ReviewController::class, 'transitions']);
    Route::get('/posts/{post}/allowed-transitions', [ReviewController::class, 'allowedTransitions']);

    // Blog Posts
    Route::apiResource('posts', PostController::class);
    Route::apiResource('categories', CategoryController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::apiResource('tags', TagController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::apiResource('media', MediaController::class);

    // Admin - User Management
    Route::get('/users', [AdminController::class, 'users']);
    Route::put('/users/{user}/role', [AdminController::class, 'updateRole']);

    // Social Connections (OAuth)
    Route::get('/social/connections', [\App\Http\Controllers\Api\SocialController::class, 'index']);
    Route::post('/social/facebook/connect', [\App\Http\Controllers\Api\SocialController::class, 'connectFacebook']);
    Route::get('/social/facebook/callback', [\App\Http\Controllers\Api\SocialController::class, 'callbackFacebook']);
    Route::delete('/social/connections/{connection}', [\App\Http\Controllers\Api\SocialController::class, 'disconnect']);

    // Schedule Entries
    Route::get('/schedule/entries', [\App\Http\Controllers\Api\ScheduleController::class, 'index']);
    Route::post('/schedule/entries', [\App\Http\Controllers\Api\ScheduleController::class, 'store']);
    Route::put('/schedule/entries/{entry}', [\App\Http\Controllers\Api\ScheduleController::class, 'update']);
    Route::put('/schedule/entries/{entry}/reschedule', [\App\Http\Controllers\Api\ScheduleController::class, 'reschedule']);
    Route::delete('/schedule/entries/{entry}', [\App\Http\Controllers\Api\ScheduleController::class, 'destroy']);

    // Publishing History & Retry (Phase 6)
    Route::get('/schedule/history', [\App\Http\Controllers\Api\ScheduleController::class, 'history']);
    Route::post('/schedule/entries/{entry}/retry', [\App\Http\Controllers\Api\ScheduleController::class, 'retry']);

    // Analytics (Phase 7)
    Route::get('/analytics', [\App\Http\Controllers\Api\AnalyticsController::class, 'index']);
    Route::get('/analytics/export', [\App\Http\Controllers\Api\AnalyticsController::class, 'export']);
    Route::get('/analytics/admin', [\App\Http\Controllers\Api\AnalyticsController::class, 'admin'])->middleware('can:admin');

    // Messages (Phase 8)
    Route::get('/messages/inbox', [\App\Http\Controllers\Api\MessageController::class, 'inbox']);
    Route::get('/messages/sent', [\App\Http\Controllers\Api\MessageController::class, 'sent']);
    Route::post('/messages', [\App\Http\Controllers\Api\MessageController::class, 'store']);
    Route::get('/messages/users', [\App\Http\Controllers\Api\MessageController::class, 'users']);
    Route::get('/messages/{message}', [\App\Http\Controllers\Api\MessageController::class, 'show']);
    Route::delete('/messages/{message}', [\App\Http\Controllers\Api\MessageController::class, 'destroy']);

    // Notifications (Phase 8)
    Route::get('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [\App\Http\Controllers\Api\NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{notification}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markRead']);
    Route::post('/notifications/mark-all-read', [\App\Http\Controllers\Api\NotificationController::class, 'markAllRead']);
});
