/**
 * Convertit une chaîne en slug (URL-friendly)
 * @param str La chaîne à slugifier
 * @returns Le slug
 */
export function slugify(str: string): string {
	return str
		.toLowerCase()
		.normalize('NFD') // Décompose les caractères accentués
		.replace(/[\u0300-\u036f]/g, '') // Supprime les diacritiques
		.replace(/[^a-z0-9]+/g, '-') // Remplace les caractères non-alphanumériques par des tirets
		.replace(/^-+|-+$/g, ''); // Supprime les tirets au début et à la fin
}
