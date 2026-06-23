<?php

namespace App\Actions;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class ChangePasswordAction
{
    public function execute(User $user, string $currentPassword, string $newPassword): void
    {
        if (!Hash::check($currentPassword, $user->password)) {
            throw new RuntimeException('Current password is incorrect.');
        }

        $user->update([
            'password' => Hash::make($newPassword),
        ]);
    }
}
