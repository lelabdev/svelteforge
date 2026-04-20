<script lang="ts">
	import Icon from '../../icons/Icon.svelte';

	interface BreadcrumbItem {
		label: string;
		href?: string;
	}

	interface Props {
		items: BreadcrumbItem[];
		class?: string;
	}

	let { items, class: className = '' }: Props = $props();

	const lastIndex = $derived(items.length - 1);
</script>

{#if items.length > 0}
	<nav aria-label="Breadcrumb" class="breadcrumb {className}">
		<ol class="breadcrumb-list">
			{#each items as item, i (i)}
				<li class="breadcrumb-item">
					{#if i < lastIndex && item.href}
						<a href={item.href} class="breadcrumb-link">
							{item.label}
						</a>
					{:else}
						<span class="breadcrumb-current" aria-current="page">
							{item.label}
						</span>
					{/if}

					{#if i < lastIndex}
						<span class="breadcrumb-separator" aria-hidden="true">
							<Icon name="chevronRight" size={14} />
						</span>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>
{/if}

<style>
	.breadcrumb-list {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--gap-xs);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.breadcrumb-item {
		display: flex;
		align-items: center;
		gap: var(--gap-xs);
	}

	.breadcrumb-link {
		font-size: var(--text-body);
		color: var(--color-surface-500);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.breadcrumb-link:hover {
		color: var(--color-primary-500);
		text-decoration: underline;
	}

	.breadcrumb-current {
		font-size: var(--text-body);
		color: var(--color-surface-400-600);
		font-weight: var(--weight-label);
	}

	.breadcrumb-separator {
		display: inline-flex;
		align-items: center;
		color: var(--color-surface-300-700);
	}
</style>
