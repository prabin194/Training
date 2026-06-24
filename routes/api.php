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
});
