<?php

namespace App\Actions;

use App\Models\Otp;
use App\Models\User;
use App\Enums\OtpType;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

class SendPasswordResetLinkAction
{
    public function execute(string $email): void
    {
        $user = User::where('email', $email)->first();

        if (!$user) {
            // Don't reveal whether the email exists
            return;
        }

        // Invalidate any existing tokens
        Otp::where('user_id', $user->id)
            ->where('type', OtpType::PASSWORD_RESET)
            ->whereNull('used_at')
            ->update(['used_at' => Carbon::now()]);

        $rawToken = bin2hex(random_bytes(32));
        $hashedToken = Hash::make($rawToken);

        Otp::create([
            'user_id' => $user->id,
            'code' => $hashedToken,
            'type' => OtpType::PASSWORD_RESET,
            'expires_at' => Carbon::now()->addMinutes(60),
        ]);

        $resetUrl = config('app.frontend_url', config('app.url'))
            . '/reset-password?token=' . $rawToken . '&email=' . urlencode($user->email);

        Mail::to($user->email)->send(new \App\Mail\PasswordResetMail($user, $resetUrl));
    }
}
