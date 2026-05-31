# @svforge/tiptap

Rich text editor for SVForge projects. Powered by Tiptap with a built-in toolbar and preview renderer.

## Installation

```bash
bunx sv add @svforge/tiptap
```

## Usage

### Editor (editable)

```svelte
<script>
  import { TiptapEditor } from '$lib/components/svforge/tiptap';
  import type { JSONContent } from '@tiptap/core';

  let content = $state<JSONContent>({ type: 'doc', content: [] });
</script>

<TiptapEditor
  content={content}
  onUpdate={(json) => content = json}
/>
```

### Preview (read-only)

```svelte
<script>
  import { TiptapPreview } from '$lib/components/svforge/tiptap';
</script>

<TiptapPreview content={savedContent} />
```

### Custom extensions

```ts
import { Gradient, VisualHeading } from '$lib/components/svforge/tiptap/tiptap-extensions';
// Use in your own Tiptap setup
```

## What's included

- `TiptapEditor.svelte` — full editor with toolbar (bold, italic, gradient, headings)
- `TiptapToolbar.svelte` — formatting toolbar
- `TiptapPreview.svelte` — lightweight JSON→HTML renderer (no editor loaded)
- `tiptap-extensions.ts` — Gradient mark + VisualHeading node

## Dependencies

- `@tiptap/core` — editor engine
- `@tiptap/starter-kit` — bold, italic, lists, code, blockquote, etc.
- `@skeletonlabs/skeleton-svelte` >= 4.0.0 (peer)

## Features

- Dynamic import — editor loads lazily, no SSR issues
- Gradient text mark — apply gradient colors to any text
- Visual headings — styled headings without affecting document outline
- Skeleton v4 color tokens — adapts to light/dark mode automatically
