import { escapeHtml } from './security';

export function welcomeEmailHtml(name: string): string {
	// The display name is user-controlled — escape it so it can never break
	// the markup or inject HTML (#297).
	const safeName = escapeHtml(name);
	return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <h1>Welcome, ${safeName}!</h1>
    <p>Thanks for signing up. We're excited to have you on board.</p>
  </div>`;
}
