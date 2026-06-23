<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <tr>
                        <td style="padding: 40px 32px; text-align: center;">
                            <h1 style="margin: 0 0 8px; font-size: 24px; color: #1a1a2e;">Verification Code</h1>
                            <p style="margin: 0 0 24px; font-size: 16px; color: #64748b; line-height: 1.5;">
                                Hi {{ $user->name }}, please use the code below to complete your login.
                            </p>
                            <div style="display: inline-block; padding: 16px 40px; background-color: #f1f5f9; border-radius: 8px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a2e; font-family: 'Courier New', monospace;">
                                {{ $otpCode }}
                            </div>
                            <p style="margin: 24px 0 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
                                This code expires in 5 minutes. If you did not attempt to log in, please ignore this email and secure your account.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
