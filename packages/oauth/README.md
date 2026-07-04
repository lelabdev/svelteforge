# @svforge/oauth

SVForge OAuth — social authentication buttons (Google, GitHub) for SvelteKit + Better Auth.

## Install

```bash
npx sv add @svforge/oauth
```

Or with the alias:

```bash
npx sv add forge-oauth
```

## Prerequisites

This module assumes you already have:

- **SvelteKit** project
- **Better Auth** configured with a `src/lib/client/auth.ts` exporting `authClient`

## Setup

### 1. Environment Variables

Add these to your `.env`:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

**Get credentials:**

- **Google**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create OAuth 2.0 credentials
- **GitHub**: [GitHub Developer Settings](https://github.com/settings/developers) → New OAuth App

### 2. Configure Better Auth

Add social providers to your `src/lib/server/auth.ts`:

```ts
import { betterAuth } from 'better-auth';
import { env } from '$env/dynamic/private';

export const auth = betterAuth({
  // ... your existing config
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET
    }
  }
});
```

## Usage

Import the OAuth buttons component anywhere in your app:

```svelte
<script lang="ts">
  import OAuthButtons from '$lib/components/svforge/ui/OAuthButtons.svelte';
</script>

<div class="max-w-sm mx-auto">
  <h2>Sign in with</h2>
  <OAuthButtons />
</div>
```

The component renders two buttons (Google + GitHub) with loading spinners. On click, it calls `authClient.signIn.social()` with a `callbackURL` of `/admin` — update this in `OAuthButtons.svelte` to match your post-login route.

## License

MIT
