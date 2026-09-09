/**
 * Plain-TypeScript prop contracts for the primitives (#321).
 *
 * Living in a .ts module — instead of inline in the .svelte files — keeps the
 * discriminated unions and generics importable by type tests (`vitest
 * --typecheck`) and by consumers, without going through Svelte tooling.
 */
import type { Snippet } from 'svelte';
import type {
	HTMLAnchorAttributes,
	HTMLButtonAttributes,
	HTMLTableAttributes
} from 'svelte/elements';

// ── Button ───────────────────────────────────────────────────────────────

export type ButtonVariant = 'filled' | 'outlined' | 'tonal' | 'ghost';
export type ButtonColor =
	| 'primary'
	| 'secondary'
	| 'tertiary'
	| 'success'
	| 'warning'
	| 'error'
	| 'surface';
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Visual + ergonomic props shared by both branches of the union. */
export interface ButtonSharedProps {
	variant?: ButtonVariant;
	color?: ButtonColor;
	size?: ButtonSize;
	/**
	 * Visual disabled state. The button branch renders a native `disabled`
	 * attribute; the anchor branch degrades to `aria-disabled` + reduced
	 * styling — anchors have no native disabled semantics (#321).
	 */
	disabled?: boolean;
	loading?: boolean;
	/**
	 * Text announced to screen readers while `loading` is active — the visual
	 * spinner is aria-hidden. Defaults to the localized `common_loading` copy.
	 */
	loadingLabel?: string;
	class?: string;
	children: Snippet;
}

/**
 * Button branch — rendered when `href` is absent OR an empty string (the
 * runtime discriminant, mirrored exactly). Anchor-only attributes (`target`,
 * `rel`) are rejected here: TypeScript enforces that each branch only carries
 * its own element's attributes (#321). `href` admits `''` so a dynamically
 * computed empty href keeps full button semantics (`type`, `name`, `form`…)
 * instead of being mis-typed into the anchor branch.
 */
export type ButtonProps = ButtonSharedProps &
	Omit<HTMLButtonAttributes, keyof ButtonSharedProps> & {
		href?: '' | undefined;
		type?: 'button' | 'submit' | 'reset';
	};

/**
 * Anchor branch — rendered when `href` is a non-empty string. Button-only
 * semantics (`type`, `name`, `form`) are rejected: a link styled as a button
 * is still a link, and a disabled/loading one keeps anchor semantics via
 * `aria-disabled` instead of falling back to a `<button>` (#321).
 *
 * Non-emptiness is enforced at RUNTIME (an empty href falls back to the
 * button branch): TypeScript cannot express `string & not ''` cleanly, so
 * the type stays the honest plain `string`.
 */
export type AnchorProps = ButtonSharedProps &
	Omit<HTMLAnchorAttributes, keyof ButtonSharedProps | 'href' | 'type'> & {
		href: string;
		type?: undefined;
	};

/**
 * Discriminated union on `href`, mirroring Button.svelte's runtime rule
 * exactly: a non-empty string selects the anchor branch; absence or `''`
 * selects the button branch (#321).
 */
export type ButtonOrAnchorProps = ButtonProps | AnchorProps;

// ── Table ────────────────────────────────────────────────────────────────

export interface TableColumn {
	key: string;
	label: string;
	class?: string;
}

/**
 * Stable row identity (#321): a field name on the row object, or a function
 * deriving the key. Array indices are never a valid key source — index keys
 * corrupt keyed reconciliation on insert/remove/reorder.
 */
export type TableRowKey<Row> = (keyof Row) & string | ((row: Row) => string | number);

/** Table attributes and content — shared by every `Row` shape. */
interface TableBaseProps<Row> extends Omit<HTMLTableAttributes, 'children'> {
	columns: TableColumn[];
	rows: Row[];
	/** Accessible table caption — plain text or a snippet for rich content. */
	caption?: string | Snippet;
	class?: string;
	/** Optional per-cell renderer for rich cells (avatar, badge, actions…). */
	children?: Snippet<[{ row: Row; col: TableColumn }]>;
	/** Rendered in a full-width cell when `rows` is empty. */
	empty?: Snippet;
}

/**
 * Structured table contract (#321): attributes land on the `<table>` element
 * (not an outer div), rows are generic, and the per-cell renderer receives the
 * typed row. Object rows REQUIRE a `rowKey`; primitive rows key on their own
 * value and must not pass one.
 */
export type TableProps<Row> = TableBaseProps<Row> &
	(Row extends object ? { rowKey: TableRowKey<Row> } : { rowKey?: undefined });
