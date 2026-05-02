/**
 * Utility functions for handling form errors from Superforms/Zod 4
 */

/**
 * Extracts the first error message from a Superforms/Zod 4 error object
 *
 * Zod 4 uses { _errors: string[] } format for error objects
 *
 * @param err - Error value from Superforms ($errors.fieldName)
 * @returns First error message or empty string
 */
export function getFormError(err: unknown): string {
	if (!err) return '';
	if (typeof err === 'string') return err;
	if (Array.isArray(err)) return err[0] || '';
	if (typeof err === 'object' && '_errors' in err) {
		const errors = (err as { _errors?: string[] })._errors;
		if (errors && errors.length) return errors[0];
	}
	return '';
}
