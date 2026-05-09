<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { passwordResetSchema } from '$lib/schemas';
	import { AuthCard, Button, PasswordInput } from '$lib/components';

	let { data } = $props();

	const { form, errors, enhance, submitting, message } = superForm(data.form, {
		validators: zod4Client(passwordResetSchema),
		dataType: 'json',
		invalidateAll: false,
		TTL: 0
	});
</script>

<AuthCard title="Reset password" subtitle="Enter your new password below">
	<form method="POST" use:enhance class="space-y-4">
		{#if $message}
			<p class="rounded-lg bg-surface-100-800 p-3 text-center text-success-700-300" style="font-size: var(--text-sm)">
				{$message}
			</p>
		{/if}

		<PasswordInput
			id="password"
			label="New password"
			name="password"
			placeholder="••••••••"
			required
			showStrength
			bind:value={$form.password}
			error={$errors.password}
		/>

		<PasswordInput
			id="confirmPassword"
			label="Confirm new password"
			name="confirmPassword"
			placeholder="••••••••"
			required
			bind:value={$form.confirmPassword}
			error={$errors.confirmPassword}
		/>

		<Button
			type="submit"
			variant="primary"
			size="lg"
			loading={$submitting}
			class="w-full"
			style="font-weight: var(--weight-label)"
		>
			Reset Password
		</Button>
	</form>

	{#snippet footer()}
		<p class="text-center text-surface-600-400" style="font-size: var(--text-body)">
			Back to
			<Button variant="ghost" size="sm" href="/login" class="text-primary-600-400 hover:text-primary-700-300">
				Sign in
			</Button>
		</p>
	{/snippet}
</AuthCard>
