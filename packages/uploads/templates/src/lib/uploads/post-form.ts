/**
 * The POST policy limits the complete multipart request, rather than only the
 * file part. Reserve a fixed envelope so an at-limit file produced here still
 * fits inside the 10 MiB POST policy.
 */
export const MAX_POST_BODY_SIZE = 10 * 1024 * 1024;
export const MAX_MULTIPART_FORM_OVERHEAD = 64 * 1024;
export const MAX_FILE_SIZE = MAX_POST_BODY_SIZE - MAX_MULTIPART_FORM_OVERHEAD;

// Keep the variable part of the multipart envelope below the reserved space.
const MAX_POST_FIELDS = 16;
const MAX_POST_FIELD_BYTES = 16 * 1024;
const encoder = new TextEncoder();

/**
 * Build the only multipart shape sent by FileUpload.
 *
 * A fixed file part name and bounded presign fields make the 64 KiB envelope
 * reservation above conservative across browser-generated multipart boundaries.
 */
export function createUploadForm(fields: Record<string, string>, file: File): FormData {
	const entries = Object.entries(fields);
	const fieldBytes = entries.reduce((total, [name, value]) => total + encoder.encode(name).byteLength + encoder.encode(value).byteLength, 0);
	if (
		entries.length > MAX_POST_FIELDS ||
		entries.some(([, value]) => typeof value !== 'string') ||
		fieldBytes > MAX_POST_FIELD_BYTES
	) {
		throw new Error('Upload form fields exceed the supported multipart envelope');
	}

	const form = new FormData();
	for (const [name, value] of entries) form.append(name, value);
	// Never serialize the user-controlled filename into the multipart headers.
	form.append('file', file, 'upload');
	return form;
}
