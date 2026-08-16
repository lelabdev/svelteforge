#!/usr/bin/env bash
# Regenerate the llms-*.txt documentation dumps in packages/svforge/docs/.
# Sources serve the current major versions (Skeleton v5, Svelte 5 + SvelteKit 2).
# A fetch header (source + date) is prepended — tests/llms-docs-freshness.test.ts
# verifies it and fails when the dumps go stale.
#
# Usage: bash packages/svforge/scripts/fetch-llms-docs.sh
set -euo pipefail

DOCS_DIR="$(cd "$(dirname "$0")/../docs" && pwd)"
FETCHED="$(date +%Y-%m-%d)"

fetch() {
	local url="$1" out="$2"
	echo "→ $(basename "$out") ($url, fetched $FETCHED)"
	{
		echo "---"
		echo "source: $url"
		echo "fetched: $FETCHED"
		echo "---"
		echo
		curl -sL --fail --max-time 120 "$url"
	} > "$out"
}

fetch "https://skeleton.dev/llms-full.txt" "$DOCS_DIR/llms-skeleton.txt"
fetch "https://svelte.dev/llms-full.txt" "$DOCS_DIR/llms-svelte.txt"

echo "✅ Dumps regenerated in $DOCS_DIR"
echo "   Commit the result to refresh the offline reference."
