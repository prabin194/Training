<?php

namespace App\Actions;

use App\Enums\OnboardingStatus;
use App\Enums\OtpType;
use App\Models\DeviceLog;
use App\Models\Otp;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class VerifyLoginOtpAction
{
    public function execute(string $uid, string $code, Request $request): User
    {
        $user = User::where('uid', $uid)->first();

        if (!$user) {
            throw new RuntimeException('User not found.');
        }

        $otp = Otp::where('user_id', $user->id)
            ->where('type', OtpType::LOGIN)
            ->whereNull('used_at')
            ->latest()
            ->first();

        if (!$otp || !$otp->isValid() || !Hash::check($code, $otp->code)) {
            throw new RuntimeException('Invalid or expired verification code.');
        }

        $otp->update(['used_at' => Carbon::now()]);

        $user->update(['onboarding_status' => OnboardingStatus::COMPLETED]);

        $deviceData = $this->parseDeviceInfo($request);

        DeviceLog::updateOrCreate(
            [
                'user_id' => $user->id,
                'device_name' => $deviceData['device_name'],
                'ip_address' => $request->ip(),
            ],
            [
                'device_type' => $deviceData['device_type'],
                'user_agent' => $request->userAgent(),
                'last_activity_at' => Carbon::now(),
            ]
        );

        // Log the user into the session — httpOnly cookie, no token exposed to JS
        Auth::guard('web')->login($user);

        return $user->fresh();
    }

    private function parseDeviceInfo(Request $request): array
    {
        $userAgent = $request->userAgent() ?? '';
        $deviceName = 'Unknown Device';
        $deviceType = 'unknown';

        if (preg_match('/Windows NT/', $userAgent)) {
            $deviceName = 'Windows';
            $deviceType = 'desktop';
        } elseif (preg_match('/Macintosh|Mac OS X/', $userAgent)) {
            $deviceName = 'macOS';
            $deviceType = 'desktop';
        } elseif (preg_match('/Linux/', $userAgent) && !preg_match('/Android/', $userAgent)) {
            $deviceName = 'Linux';
            $deviceType = 'desktop';
        } elseif (preg_match('/Android/', $userAgent)) {
            $deviceName = 'Android';
            $deviceType = 'mobile';
        } elseif (preg_match('/iPhone|iPad|iPod/', $userAgent)) {
            $deviceName = 'iOS';
            $deviceType = 'mobile';
        }

        return [
            'device_name' => $deviceName,
            'device_type' => $deviceType,
        ];
    }
}
