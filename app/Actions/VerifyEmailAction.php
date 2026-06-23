<?php

namespace App\Actions;

use App\Enums\OnboardingStatus;
use App\Enums\OtpType;
use App\Models\Otp;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class VerifyEmailAction
{
    public function execute(string $uid, string $token): User
    {
        $user = User::where('uid', $uid)->first();

        if (!$user) {
            throw new RuntimeException('Invalid verification link.');
        }

        if ($user->email_verified_at) {
            return $user;
        }

        $otp = Otp::where('user_id', $user->id)
            ->where('type', OtpType::EMAIL_VERIFICATION)
            ->whereNull('used_at')
            ->latest()
            ->first();

        if (!$otp || !$otp->isValid() || !Hash::check($token, $otp->code)) {
            throw new RuntimeException('Invalid or expired verification link.');
        }

        $otp->update(['used_at' => Carbon::now()]);

        $user->update([
            'email_verified_at' => Carbon::now(),
            'onboarding_status' => OnboardingStatus::COMPLETED,
        ]);

        return $user->fresh();
    }
}
