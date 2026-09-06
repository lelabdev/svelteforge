import { describe, expect, it } from 'vitest';

const {
	canaryFailureSignature,
	canaryIssueMarker,
	findExistingCanaryIssue
} = await import('../scripts/canary-issue.mjs');

describe('canary issue deduplication (#334)', () => {
	it('keeps the failure signature stable across transient paths and timestamps', () => {
		const first = canaryFailureSignature(
			'2026-09-02T06:00:00Z\nError: /tmp/svforge-base-1234 failed'
		);
		const second = canaryFailureSignature(
			'2026-09-09T06:00:00Z\nError: /tmp/svforge-base-5678 failed'
		);

		expect(first).toBe(second);
		expect(canaryFailureSignature('Error: Skeleton utility changed')).not.toBe(first);
	});

	it('finds an existing open issue for the same profile and failure', () => {
		const marker = canaryIssueMarker('base', 'abc123');
		const existing = { number: 42, body: `details\n${marker}` };
		const pullRequest = { number: 43, body: marker, pull_request: { url: 'https://example.test/pr' } };

		expect(findExistingCanaryIssue([pullRequest, existing], marker)).toBe(existing);
		expect(canaryIssueMarker('dashboard', 'abc123')).not.toBe(marker);
	});
});
