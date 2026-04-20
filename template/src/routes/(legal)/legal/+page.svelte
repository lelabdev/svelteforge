<script lang="ts">
	import { Card } from '$lib/components/ui';
	const currentYear = new Date().getFullYear();
</script>

<svelte:head>
	<title>Legal Notice - SvelteForge</title>
</svelte:head>

<div class="container mx-auto px-4 max-w-4xl py-12">
	<h1 class="text-3xl font-black mb-8 uppercase tracking-tight">Legal Notice</h1>

	<Card padding="p-8 sm:p-12">
		<div class="space-y-10">
			<section>
				<h2
					class="text-xl font-bold mb-4 uppercase tracking-wide text-primary-600-400"
				>
					1. Publisher
				</h2>
				<div class="text-surface-600-400 leading-relaxed">
					This website is published by:<br />
					<strong class="text-surface-900-100">[Company name]</strong><br />
					[Legal form] with a capital of [amount]<br />
					Registered office: [address]<br />
					SIRET: [SIRET number]<br />
					Phone: [phone]<br />
					Email: [email]<br />
					Publication director: [name]
				</div>
			</section>

			<section>
				<h2
					class="text-xl font-bold mb-4 uppercase tracking-wide text-primary-600-400"
				>
					2. Hosting
				</h2>
				<div class="text-surface-600-400 leading-relaxed">
					This website is hosted by:<br />
					<strong class="text-surface-900-100">[Hosting provider]</strong><br />
					[Hosting provider address]<br />
					[Hosting provider phone]
				</div>
			</section>

			<section>
				<h2
					class="text-xl font-bold mb-4 uppercase tracking-wide text-primary-600-400"
				>
					3. Intellectual property
				</h2>
				<p class="text-surface-600-400 leading-relaxed">
					All content on this website (texts, images, videos, logos, etc.) is protected by
					copyright and trademark law. Any reproduction, representation, modification,
					publication, or adaptation of all or part of the site's elements is prohibited without
					prior written authorization.
				</p>
			</section>

			<section>
				<h2
					class="text-xl font-bold mb-4 uppercase tracking-wide text-primary-600-400"
				>
					4. Personal data
				</h2>
				<p class="text-surface-600-400 leading-relaxed">
					For any information regarding the processing of your personal data, please consult our
					<a href="/privacy" class="text-primary-500 hover:underline font-bold">privacy policy</a>.
				</p>
			</section>

			<section>
				<h2
					class="text-xl font-bold mb-4 uppercase tracking-wide text-primary-600-400"
				>
					5. Cookies
				</h2>
				<p class="text-surface-600-400 leading-relaxed">
					This website uses cookies to improve the user experience. By continuing to browse this
					site, you accept the use of cookies.
				</p>
			</section>

			<section>
				<h2
					class="text-xl font-bold mb-4 uppercase tracking-wide text-primary-600-400"
				>
					6. Contact
				</h2>
				<p class="text-surface-600-400 leading-relaxed">
					For any questions regarding this legal notice, you can contact us at: [contact email]
				</p>
			</section>
		</div>

		<div class="mt-12 pt-8 border-t border-surface-200-700">
			<p class="text-xs text-surface-500 uppercase font-bold tracking-widest">
				Last updated: {currentYear}
			</p>
		</div>
	</Card>
</div>
