<?php

namespace App\Enums;

enum OnboardingStatus: string
{
    case EMAIL_VERIFICATION = 'EMAIL_VERIFICATION';
    case PASSWORD_SET = 'PASSWORD_SET';
    case OTP_VERIFICATION = 'OTP_VERIFICATION';
    case COMPLETED = 'COMPLETED';
}
