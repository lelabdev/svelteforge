<script lang="ts">
	import { Card } from '$lib/components/ui';
	const currentYear = new Date().getFullYear();
</script>

<svelte:head>
	<title>Privacy Policy - SvelteForge</title>
</svelte:head>

<div class="container mx-auto px-4 max-w-4xl py-12">
	<h1 class="text-3xl font-black mb-8 uppercase tracking-tight">Privacy Policy</h1>

	<Card padding="p-8 sm:p-12">
		<div class="space-y-10">
			<section>
				<h2
					class="text-xl font-bold mb-4 uppercase tracking-wide text-primary-600-400"
				>
					1. Introduction
				</h2>
				<p class="text-surface-600-400 leading-relaxed">
					This privacy policy describes how we collect, use, and protect your personal information
					when you use our website and services.
				</p>
			</section>

			<section>
				<h2
					class="text-xl font-bold mb-4 uppercase tracking-wide text-primary-600-400"
				>
					2. Data collected
				</h2>
				<p class="text-surface-600-400 mb-4 leading-relaxed">
					We may collect the following types of data:
				</p>
				<ul
					class="list-disc list-inside text-surface-600-400 space-y-2 ml-2"
				>
					<li>Identification information (name, email)</li>
					<li>Connection information (IP address, browser, device)</li>
					<li>Service usage data</li>
				</ul>
			</section>

			<section>
				<h2
					class="text-xl font-bold mb-4 uppercase tracking-wide text-primary-600-400"
				>
					3. Purpose of processing
				</h2>
				<p class="text-surface-600-400 mb-4 leading-relaxed">
					Your data is used to:
				</p>
				<ul
					class="list-disc list-inside text-surface-600-400 space-y-2 ml-2"
				>
					<li>Manage your user account</li>
					<li>Provide our services</li>
					<li>Improve our service</li>
					<li>Comply with our legal obligations</li>
				</ul>
			</section>

			<section>
				<h2
					class="text-xl font-bold mb-4 uppercase tracking-wide text-primary-600-400"
				>
					4. Legal basis
				</h2>
				<p class="text-surface-600-400 leading-relaxed">
					The processing of your personal data is based on the execution of the contract,
					compliance with our legal obligations, and your consent.
				</p>
			</section>

			<section>
				<h2
					class="text-xl font-bold mb-4 uppercase tracking-wide text-primary-600-400"
				>
					5. Retention period
				</h2>
				<p class="text-surface-600-400 leading-relaxed">
					Your data is retained for the duration of your registration, plus the retention periods
					required by law.
				</p>
			</section>

			<section>
				<h2
					class="text-xl font-bold mb-4 uppercase tracking-wide text-primary-600-400"
				>
					6. Your rights
				</h2>
				<p class="text-surface-600-400 mb-4 leading-relaxed">
					Under GDPR, you have the following rights:
				</p>
				<ul
					class="list-disc list-inside text-surface-600-400 space-y-2 ml-2"
				>
					<li>Right of access to your data</li>
					<li>Right to rectification</li>
					<li>Right to erasure</li>
					<li>Right to data portability</li>
					<li>Right to object</li>
				</ul>
				<p class="text-surface-600-400 mt-4 leading-relaxed italic">
					To exercise these rights, contact us at: [email]
				</p>
			</section>

			<section>
				<h2
					class="text-xl font-bold mb-4 uppercase tracking-wide text-primary-600-400"
				>
					7. Security
				</h2>
				<p class="text-surface-600-400 leading-relaxed">
					We implement appropriate technical and organizational measures to protect your personal
					data against unauthorized access, modification, disclosure, or destruction.
				</p>
			</section>

			<section>
				<h2
					class="text-xl font-bold mb-4 uppercase tracking-wide text-primary-600-400"
				>
					8. Cookies
				</h2>
				<p class="text-surface-600-400 leading-relaxed">
					Our website uses cookies to ensure proper functioning and improve the user experience.
					You can configure your browser to refuse cookies.
				</p>
			</section>

			<section>
				<h2
					class="text-xl font-bold mb-4 uppercase tracking-wide text-primary-600-400"
				>
					9. Contact
				</h2>
				<p class="text-surface-600-400 leading-relaxed">
					For any questions regarding this policy, contact our DPO at: [email]
				</p>
			</section>
		</div>

		<div class="mt-12 pt-8 border-t border-surface-200-700">
			<p class="text-xs text-muted-foreground uppercase font-bold tracking-widest">
				Last updated: {currentYear}
			</p>
		</div>
	</Card>
</div>
