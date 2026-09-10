/**
 * Reusable Skeleton v5 theme validator (#315).
 *
 * Validates ANY Skeleton v5 theme file (the canonical `svelteforge-theme.css`,
 * a renamed project theme, or a test fixture) for:
 * 1. palette completeness — 7 palettes × shades 50…950;
 * 2. contrast mapping completeness — every shade declares a contrast pair;
 * 3. cross-theme variables — spacing, text scaling, typography, radii,
 *    corner shapes, default border widths, root backgrounds, brand;
 * 4. obsolescence — pre-v5 variables must not reappear;
 * 5. WCAG contrast — every declared (shade, contrast-shade) pair must reach
 *    the target ratio (WCAG AA 4.5:1 for normal text by default), with
 *    shade-by-shade messages (`success-500 contrast = 4.18:1 (< 4.5)`).
 *
 * No dependency on the theme filename: callers pass the CSS text.
 */

export interface ThemeViolation {
	rule: string;
	message: string;
}

export interface ThemeValidationOptions {
	/** Minimum WCAG contrast ratio for declared pairs (default 4.5 = AA normal text). */
	minContrast?: number;
	/** Palettes to validate (default: the 7 Skeleton families). */
	palettes?: string[];
	/** Shades to validate (default: Skeleton's 11-step scale). */
	shades?: string[];
}

export const SKELETON_PALETTES = ['primary', 'secondary', 'tertiary', 'success', 'warning', 'error', 'surface'] as const;
export const SKELETON_SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;

/** Pre-v5 variables that are dead in Skeleton v5 (#194) — they must never reappear. */
export const PRE_V5_VARIABLES = [
	'--base-font-family',
	'--body-background-color',
	'--anchor-font-color',
	'--heading-font-family'
] as const;

/** Cross-theme Skeleton v5 variables every complete theme must define. */
export const REQUIRED_VARIABLES = [
	'--spacing',
	'--text-scaling',
	'--radius-base',
	'--radius-container',
	'--corner-shape-base',
	'--corner-shape-container',
	'--default-border-width',
	'--default-outline-width',
	'--default-ring-width',
	'--color-root-bg-light',
	'--color-root-bg-dark',
	'--color-brand-light',
	'--color-brand-dark',
	'--color-brand-contrast-light',
	'--color-brand-contrast-dark'
] as const;

/** Skeleton v5 typography roles and the properties each must declare. */
export const TYPO_ROLES: Record<string, string[]> = {
	base: ['--font-family', '--font-size', '--font-weight', '--line-height', '--color-light', '--color-dark'],
	heading: ['--font-family', '--font-weight', '--color-light', '--color-dark'],
	anchor: ['--font-family', '--color-light', '--color-dark']
};

/** Extract every custom property declaration from CSS text (comments stripped). */
export function parseThemeVariables(css: string): Map<string, string> {
	const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
	const vars = new Map<string, string>();
	for (const match of code.matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;{}]+)[;}]?/g)) {
		vars.set(match[1], match[2].trim());
	}
	return vars;
}

/** Resolve `var()` chains to a concrete value (cycle-safe). */
export function resolveVariable(vars: Map<string, string>, name: string, seen = new Set<string>()): string | undefined {
	if (seen.has(name)) return undefined; // cycle
	seen.add(name);
	const value = vars.get(name);
	if (value === undefined) return undefined;
	const ref = value.match(/^var\(\s*(--[a-zA-Z0-9-]+)\s*\)$/);
	if (ref) return resolveVariable(vars, ref[1], seen);
	return value;
}

/**
 * Convert oklch(L% C Hdeg) to linear-light sRGB triple.
 * Standard OKLab → lMS′ → lms → sRGB matrices (Björn Ottosson).
 */
export function oklchToLinearSrgb(lPercent: number, chroma: number, hueDeg: number): [number, number, number] {
	const L = lPercent / 100;
	const h = (hueDeg * Math.PI) / 180;
	const a = chroma * Math.cos(h);
	const b = chroma * Math.sin(h);
	const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = L - 0.0894841775 * a - 1.291485548 * b;
	const l = l_ ** 3;
	const m = m_ ** 3;
	const s = s_ ** 3;
	return [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
	];
}

/** WCAG relative luminance from linear-light sRGB. */
export function relativeLuminance(linear: [number, number, number]): number {
	return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/** Parse a CSS color into WCAG relative luminance. Supports oklch() and #hex. */
export function parseLuminance(value: string): number | undefined {
	const oklch = value.match(/oklch\(\s*([\d.]+)%\s+([\d.]+)\s+(-?[\d.]+|none)/);
	if (oklch) {
		const hue = oklch[3] === 'none' ? 0 : parseFloat(oklch[3]);
		return relativeLuminance(oklchToLinearSrgb(parseFloat(oklch[1]), parseFloat(oklch[2]), hue));
	}
	const hex = value.match(/^#([0-9a-f]{6})$/i);
	if (hex) {
		const int = parseInt(hex[1], 16);
		const channels = [(int >> 16) & 255, (int >> 8) & 255, int & 255].map((c) => {
			const s = c / 255;
			return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
		});
		return relativeLuminance(channels as [number, number, number]);
	}
	return undefined;
}

/** WCAG contrast ratio between two concrete CSS colors (oklch or #hex). */
export function contrastRatio(foreground: string, background: string): number | undefined {
	const lf = parseLuminance(foreground);
	const lb = parseLuminance(background);
	if (lf === undefined || lb === undefined) return undefined;
	const [hi, lo] = lf >= lb ? [lf, lb] : [lb, lf];
	return (hi + 0.05) / (lo + 0.05);
}

/**
 * Validate a Skeleton v5 theme (CSS text) — see module docs.
 * Returns every violation found; an empty array means the theme is complete
 * and accessible under the given options.
 */
export function validateSkeletonTheme(css: string, options: ThemeValidationOptions = {}): ThemeViolation[] {
	const minContrast = options.minContrast ?? 4.5;
	const palettes = options.palettes ?? [...SKELETON_PALETTES];
	const shades = options.shades ?? [...SKELETON_SHADES];
	const violations: ThemeViolation[] = [];
	const vars = parseThemeVariables(css);

	// 4. Obsolete pre-v5 variables must not reappear.
	for (const obsolete of PRE_V5_VARIABLES) {
		if (vars.has(obsolete)) violations.push({ rule: 'obsolete-var', message: `${obsolete} is a dead pre-v5 variable — remove it (Skeleton v5 uses --typo-* / --color-root-bg-*)` });
	}

	// 3. Cross-theme variables.
	for (const required of REQUIRED_VARIABLES) {
		if (!vars.has(required)) violations.push({ rule: 'required-var', message: `missing required Skeleton v5 variable ${required}` });
	}
	for (const [role, properties] of Object.entries(TYPO_ROLES)) {
		for (const property of properties) {
			const name = `--typo-${role}${property}`;
			if (!vars.has(name)) violations.push({ rule: 'required-var', message: `missing required Skeleton v5 variable ${name}` });
		}
	}

	// 1 + 2 + 5. Palettes, contrast mappings, WCAG ratios.
	for (const palette of palettes) {
		for (const shade of shades) {
			const shadeVar = `--color-${palette}-${shade}`;
			const contrastVar = `--color-${palette}-contrast-${shade}`;
			const shadeValue = resolveVariable(vars, shadeVar);
			if (shadeValue === undefined) {
				violations.push({ rule: 'palette-shade', message: `missing shade ${shadeVar}` });
				continue;
			}
			const contrastValue = resolveVariable(vars, contrastVar);
			if (contrastValue === undefined) {
				violations.push({ rule: 'contrast-mapping', message: `missing contrast mapping ${contrastVar} for ${shadeVar}` });
				continue;
			}
			const ratio = contrastRatio(contrastValue, shadeValue);
			if (ratio === undefined) {
				violations.push({ rule: 'unresolvable-color', message: `${contrastVar} → "${contrastValue}" is not a parsable color` });
				continue;
			}
			if (ratio < minContrast) {
				violations.push({
					rule: 'contrast-ratio',
					message: `${palette}-${shade} contrast = ${ratio.toFixed(2)}:1 (< ${minContrast})`
				});
			}
		}
	}

	return violations;
}
