export function resetPasswordEmailHtml(resetUrl: string): string {
	return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <h1>Reset your password</h1>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
    <p>This link expires in 1 hour.</p>
  </div>`;
}
