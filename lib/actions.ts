import { Resend } from 'resend'

// Ensure the API key is defined
if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/${resetToken}`

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: 'Reset your password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; margin: 0; padding: 0;">
            <tr>
              <td style="padding: 20px 0; text-align: center;">
                <table role="presentation" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 20px;">
                      <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin-bottom: 20px;">Reset Your Password</h1>
                      <p style="color: #4a5568; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                        We received a request to reset your password. Click the button below to choose a new password. This link will expire in 1 hour.
                      </p>
                      <a href="${resetUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin-bottom: 24px;">
                        Reset Password
                      </a>
                      <p style="color: #718096; font-size: 14px; line-height: 20px; margin-top: 24px;">
                        If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                      </p>
                      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                      <p style="color: #718096; font-size: 12px; line-height: 16px;">
                        This is an automated email. Please do not reply to this message.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  })
}