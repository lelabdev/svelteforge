<script lang="ts">
	// Test harness for the Checkbox primitive: exposes a bindable mirror so
	// tests can assert real two-way binding, not just one-off props.
	import Checkbox from '../../packages/svforge/templates/base/src/lib/components/svforge/primitives/Checkbox.svelte';

	let checked = $state(false);
</script>

<Checkbox bind:checked label="Agree" />
<p data-testid="mirror">{String(checked)}</p>
