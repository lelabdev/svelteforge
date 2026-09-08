interface ThemeMediaQuery {
	addEventListener(type: 'change', listener: (event: { matches: boolean }) => void): void;
	removeEventListener(type: 'change', listener: (event: { matches: boolean }) => void): void;
}

/** Watches OS color-scheme changes only while the visitor has no saved choice. */
export function followSystemTheme(
	stored: string | null,
	media: ThemeMediaQuery,
	apply: (dark: boolean) => void
): (() => void) | undefined {
	if (stored === 'dark' || stored === 'light') return undefined;

	const onSystemChange = (event: { matches: boolean }) => apply(event.matches);
	media.addEventListener('change', onSystemChange);
	return () => media.removeEventListener('change', onSystemChange);
}
