<?php

namespace App\Http\Controllers;

use App\Actions\RegisterUserAction;
use App\Actions\ResendVerificationEmailAction;
use App\Actions\ResetPasswordAction;
use App\Actions\SendLoginOtpAction;
use App\Actions\SendPasswordResetLinkAction;
use App\Actions\VerifyEmailAction;
use App\Actions\VerifyLoginOtpAction;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResendLoginOtpRequest;
use App\Http\Requests\ResendVerificationEmailRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Requests\VerifyEmailRequest;
use App\Http\Requests\VerifyOtpRequest;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\LoginLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private RegisterUserAction $registerUser,
        private VerifyEmailAction $verifyEmail,
        private SendLoginOtpAction $sendLoginOtp,
        private VerifyLoginOtpAction $verifyLoginOtp,
        private SendPasswordResetLinkAction $sendPasswordResetLink,
        private ResetPasswordAction $resetPassword,
        private ResendVerificationEmailAction $resendVerificationEmail,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->registerUser->execute($request->validated());

        ActivityLog::log($user, 'register', 'Account created.');

        return response()->json([
            'message' => 'Registration successful. Please check your email to verify your account.',
            'user' => new UserResource($user),
        ], 201);
    }

    public function verifyEmail(VerifyEmailRequest $request): JsonResponse
    {
        try {
            $user = $this->verifyEmail->execute($request->uid, $request->token);
            ActivityLog::log($user, 'email_verified', 'Email address verified.');
        } catch (\RuntimeException $e) {
            $status = $e->getMessage() === 'Invalid verification link.' ? 404 : 400;
            return response()->json(['message' => $e->getMessage()], $status);
        }

        return response()->json(['message' => 'Email verified successfully. You can now log in.']);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            if ($user) {
                LoginLog::create([
                    'user_id' => $user->id,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'login_at' => Carbon::now(),
                    'login_successful' => false,
                    'failure_reason' => 'Invalid password',
                ]);
            }

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        LoginLog::create([
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'login_at' => Carbon::now(),
            'login_successful' => true,
        ]);

        if (!$user->email_verified_at) {
            return response()->json([
                'message' => 'Please verify your email address before logging in.',
                'requires_email_verification' => true,
                'uid' => $user->uid,
            ], 403);
        }

        $this->sendLoginOtp->execute($user);

        return response()->json([
            'message' => 'Verification code sent to your email.',
            'requires_otp' => true,
            'uid' => $user->uid,
        ]);
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        try {
            $user = $this->verifyLoginOtp->execute(
                $request->uid,
                $request->code,
                $request
            );

            ActivityLog::log($user, 'login', 'Logged in successfully.');
        } catch (\RuntimeException $e) {
            $status = $e->getMessage() === 'User not found.' ? 404 : 400;
            return response()->json(['message' => $e->getMessage()], $status);
        }

        return response()->json([
            'message' => 'Login successful.',
            'user' => new UserResource($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->tokens()->delete();

        auth('web')->logout();
        session()->invalidate();
        session()->regenerateToken();

        ActivityLog::log($user, 'logout', 'Logged out.');

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $this->sendPasswordResetLink->execute($request->email);

        return response()->json([
            'message' => 'If an account with that email exists, a password reset link has been sent.',
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        try {
            $this->resetPassword->execute(
                $request->email,
                $request->token,
                $request->password
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }

        return response()->json(['message' => 'Password reset successfully. You can now log in with your new password.']);
    }

    public function resendVerificationEmail(ResendVerificationEmailRequest $request): JsonResponse
    {
        try {
            $this->resendVerificationEmail->execute($request->email);
        } catch (\RuntimeException $e) {
            $status = $e->getMessage() === 'Your email is already verified. You can log in.' ? 400 : 200;
            return response()->json(['message' => $e->getMessage()], $status);
        }

        return response()->json(['message' => 'A new verification link has been sent to your email.']);
    }

    public function resendLoginOtp(ResendLoginOtpRequest $request): JsonResponse
    {
        $user = User::where('uid', $request->uid)->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid verification session.'], 404);
        }

        $this->sendLoginOtp->execute($user);

        return response()->json(['message' => 'A new verification code has been sent to your email.']);
    }
}
