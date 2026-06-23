<?php

namespace App\Actions;

use App\Enums\OtpType;
use App\Models\Otp;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class ResetPasswordAction
{
    public function execute(string $email, string $token, string $password): void
    {
        $user = User::where('email', $email)->first();

        if (!$user) {
            throw new RuntimeException('Invalid or expired reset link.');
        }

        $otp = Otp::where('user_id', $user->id)
            ->where('type', OtpType::PASSWORD_RESET)
            ->whereNull('used_at')
            ->latest()
            ->first();

        if (!$otp || !$otp->isValid() || !Hash::check($token, $otp->code)) {
            throw new RuntimeException('Invalid or expired reset link.');
        }

        $otp->update(['used_at' => Carbon::now()]);

        $user->update([
            'password' => Hash::make($password),
        ]);
    }
}
