export function welcomeEmailHtml(name: string): string {
	return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <h1>Welcome, ${name}!</h1>
    <p>Thanks for signing up. We're excited to have you on board.</p>
  </div>`;
}
