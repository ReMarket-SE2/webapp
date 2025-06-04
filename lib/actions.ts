// Common email template function
const createEmailTemplate = (title: string, message: string, buttonText: string, buttonUrl: string) => {
  return `
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
                    <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin-bottom: 20px;">${title}</h1>
                    <p style="color: #4a5568; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                      ${message}
                    </p>
                    <a href="${buttonUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin-bottom: 24px;">
                      ${buttonText}
                    </a>
                    <p style="color: #718096; font-size: 14px; line-height: 20px; margin-top: 24px;">
                      If you didn't request this, you can safely ignore this email.
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
  `;
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.warn('Missing RESEND_API_KEY. Skipping password reset email.');
    return;
  }

  const { Resend } = await import('resend');
  const resend = new Resend(RESEND_API_KEY);
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/${resetToken}`;

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: 'Reset your password',
    html: createEmailTemplate(
      'Reset Your Password',
      'We received a request to reset your password. Click the button below to choose a new password. This link will expire in 1 hour.',
      'Reset Password',
      resetUrl
    )
  });
};

export const sendEmailVerificationEmail = async (email: string, verificationToken: string) => {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.warn('Missing RESEND_API_KEY. Skipping email verification email.');
    return;
  }

  const { Resend } = await import('resend');
  const resend = new Resend(RESEND_API_KEY);
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email/${verificationToken}`;

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: 'Verify your email address',
    html: createEmailTemplate(
      'Verify Your Email Address',
      'Welcome! Please verify your email address to complete your account setup. Click the button below to verify your email. This link will expire in 24 hours.',
      'Verify Email',
      verificationUrl
    )
  });
};