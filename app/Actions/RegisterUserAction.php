<?php

namespace App\Actions;

use App\Enums\OnboardingStatus;
use App\Enums\OtpType;
use App\Mail\EmailVerificationMail;
use App\Models\Otp;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class RegisterUserAction
{
    public function execute(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'onboarding_status' => OnboardingStatus::EMAIL_VERIFICATION,
        ]);

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
