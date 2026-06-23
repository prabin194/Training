<?php

namespace App\Actions;

use App\Enums\OnboardingStatus;
use App\Enums\OtpType;
use App\Mail\OtpMail;
use App\Models\Otp;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class SendLoginOtpAction
{
    public function execute(User $user): void
    {
        Otp::where('user_id', $user->id)
            ->where('type', OtpType::LOGIN)
            ->whereNull('used_at')
            ->update(['used_at' => Carbon::now()]);

        $otpCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $hashedCode = Hash::make($otpCode);

        Otp::create([
            'user_id' => $user->id,
            'code' => $hashedCode,
            'type' => OtpType::LOGIN,
            'expires_at' => Carbon::now()->addMinutes(5),
        ]);

        $user->update(['onboarding_status' => OnboardingStatus::OTP_VERIFICATION]);

        Mail::to($user->email)->send(new OtpMail($user, $otpCode));
    }
}
