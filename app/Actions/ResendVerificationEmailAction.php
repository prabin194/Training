<?php

namespace App\Actions;

use App\Enums\OtpType;
use App\Mail\EmailVerificationMail;
use App\Models\Otp;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

class ResendVerificationEmailAction
{
    public function execute(string $email): User
    {
        $user = User::where('email', $email)->first();

        if (!$user) {
            throw new RuntimeException('If an account with that email exists, a verification link has been sent.');
        }

        if ($user->email_verified_at) {
            throw new RuntimeException('Your email is already verified. You can log in.');
        }

        // Invalidate any previous unused email verification OTPs
        Otp::where('user_id', $user->id)
            ->where('type', OtpType::EMAIL_VERIFICATION)
            ->whereNull('used_at')
            ->update(['used_at' => Carbon::now()]);

        // Create a fresh verification token
        $rawToken = bin2hex(random_bytes(32));
        $hashedToken = Hash::make($rawToken);

        Otp::create([
            'user_id' => $user->id,
            'code' => $hashedToken,
            'type' => OtpType::EMAIL_VERIFICATION,
            'expires_at' => Carbon::now()->addMinutes(60),
        ]);

        $verificationUrl = rtrim(config('app.url'), '/') . '/verify-email?token=' . $rawToken . '&uid=' . $user->uid;

        Mail::to($user->email)->send(new EmailVerificationMail($user, $verificationUrl));

        return $user;
    }
}
