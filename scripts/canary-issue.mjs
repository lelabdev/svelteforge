import { createHash } from 'node:crypto';

/**
 * Normalize values that change between canary runs without changing the
 * underlying failure. The normalized log is hashed into the issue key.
 */
export function normalizeCanaryLog(log) {
	return log
		.replace(/\r/g, '')
		.replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/g, '<timestamp>')
		.replace(/\/tmp\/[^\s/]+/g, '/tmp/<temporary-path>')
		.replace(/\b(run_id|run_attempt)=\d+\b/g, '$1=<run>')
		.trim();
}

export function canaryFailureSignature(log) {
	return createHash('sha256').update(normalizeCanaryLog(log)).digest('hex').slice(0, 16);
}

export function canaryIssueMarker(profile, signature) {
	return `<!-- svforge-canary-failure profile="${profile}" signature="${signature}" -->`;
}

export function findExistingCanaryIssue(issues, marker) {
	return issues.find((issue) => !issue.pull_request && issue.body?.includes(marker));
}
