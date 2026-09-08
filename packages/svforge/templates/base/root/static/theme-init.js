(() => {
	try {
		const stored = localStorage.getItem('theme-mode');
		const mode = stored === 'dark' || stored === 'light'
			? stored
			: window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light';
		document.documentElement.setAttribute('data-mode', mode);
		document.documentElement.style.colorScheme = mode;
	} catch {
		// Storage can be unavailable in private or constrained browsing contexts.
	}
})();
