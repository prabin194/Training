<?php

namespace App\Enums;

enum OtpType: string
{
    case EMAIL_VERIFICATION = 'email_verification';
    case LOGIN = 'login';
    case PASSWORD_RESET = 'password_reset';
}
