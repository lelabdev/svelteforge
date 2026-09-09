<script lang="ts">
	// Test harness for the Toggle primitive: exposes a bindable mirror so tests
	// can assert real two-way binding, not just one-off props.
	import Toggle from '../../packages/svforge/templates/base/src/lib/components/svforge/primitives/Toggle.svelte';

	let { initial = false }: { initial?: boolean } = $props();

	let checked = $state(initial);
</script>

<Toggle bind:checked name="notifications" />
<p data-testid="mirror">{String(checked)}</p>
