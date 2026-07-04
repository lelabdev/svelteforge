# @svforge/email

Transactional emails for SVForge projects via Resend. Adds a `sendEmail()` helper, Resend client setup, and reusable email templates.

## Installation

```bash
bunx sv add @svforge/email
```

## Setup

Add your Resend API key to `.env`:

```bash
RESEND_API_KEY=re_xxxxxxxx
```

## Usage

```ts
import { sendEmail } from '$lib/server/email';
import { welcomeEmailHtml } from '$lib/server/templates';

await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: welcomeEmailHtml('Alice')
});
```

## API

### `sendEmail(options)`

Sends an email via Resend.

| Parameter | Type | Default |
|-----------|------|---------|
| `to` | `string \| string[]` | — |
| `subject` | `string` | — |
| `html` | `string` | — |
| `from` | `string` | `noreply@example.com` |

## Templates

Pre-built HTML email templates:

- **`welcomeEmailHtml(name)`** — welcome email for new users
- **`resetPasswordEmailHtml(resetUrl)`** — password reset with styled CTA button

```ts
import { welcomeEmailHtml, resetPasswordEmailHtml } from '$lib/server/templates';
```

## What's included

- `$lib/server/email.ts` — Resend client + `sendEmail()` helper
- `$lib/server/templates/` — welcome and reset-password email templates

## Dependencies

- `resend` — official Resend Node.js SDK
