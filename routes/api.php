<?php

use App\Http\Controllers\ActivityLogController;
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

    // Activity Logs
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
});
