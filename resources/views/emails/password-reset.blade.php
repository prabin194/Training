<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <tr>
                        <td style="padding: 40px 32px; text-align: center;">
                            <h1 style="margin: 0 0 8px; font-size: 24px; color: #1a1a2e;">Reset Your Password</h1>
                            <p style="margin: 0 0 24px; font-size: 16px; color: #64748b; line-height: 1.5;">
                                Hi {{ $user->name }}, we received a request to reset your password. Click the button below to set a new one.
                            </p>
                            <a href="{{ $resetUrl }}" style="display: inline-block; padding: 14px 32px; background-color: #1a1a2e; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600;">
                                Reset Password
                            </a>
                            <p style="margin: 24px 0 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
                                This link will expire in 60 minutes. If you did not request a password reset, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
