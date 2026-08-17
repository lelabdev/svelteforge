import { describe, it, expect, beforeAll, vi } from 'vitest';

// $env/dynamic/private is a SvelteKit virtual module — not resolvable by the
// bare vitest environment. Read DATABASE_URL from the project .env (created
// by scripts/setup.sh before the CI runs `bun run test`).
vi.mock('$env/dynamic/private', async () => {
	const { readFileSync } = await import('node:fs');
	const dotenv = readFileSync('.env', 'utf8');
	const m = dotenv.match(/^DATABASE_URL="?([^"\n]+)"?$/m);
	return { env: { DATABASE_URL: m ? m[1].trim() : undefined } };
});

import { chat } from './index';
import { db } from '$lib/server/db';
import { conversations } from './schema';

/**
 * Membership & per-user read state (#281) — runs inside the
 * dashboard-foundations scaffold against the REAL PostgreSQL database
 * (the CI profile performs a drizzle push before `bun run test`).
 *
 * Users are opaque ids (the chat schema does not FK to the user table):
 * A and B are participants, OUTSIDER is not.
 */
const A = crypto.randomUUID();
const B = crypto.randomUUID();
const OUTSIDER = crypto.randomUUID();

describe('chat membership & per-user read state (#281)', () => {
	beforeAll(async () => {
		// Clean slate — FK cascades wipe participants/messages/reads.
		await db.delete(conversations);
	});

	it('unread counts are per-user: reading as A never marks messages read for B', async () => {
		const conv = await chat.createConversation({ participantIds: [A, B], type: 'direct' });
		await chat.sendMessage({ conversationId: conv.id, authorId: A, content: 'hello from A' });
		await chat.sendMessage({ conversationId: conv.id, authorId: B, content: 'hello from B' });

		// Nobody has read anything yet.
		const before = await chat.listConversations(A);
		expect(before[0].unreadCount).toBe(2);

		// A marks the whole conversation as read.
		await chat.markRead(conv.id, A);

		const afterA = await chat.listConversations(A);
		expect(afterA[0].unreadCount).toBe(0);

		// B's counter is UNAFFECTED by A's reads (#281).
		const afterB = await chat.listConversations(B);
		expect(afterB[0].unreadCount).toBe(2);
	});

	it('an outsider cannot read or modify a conversation through ANY public method', async () => {
		const conv = await chat.createConversation({ participantIds: [A, B], type: 'direct' });
		await chat.sendMessage({ conversationId: conv.id, authorId: A, content: 'secret' });

		// listMessages: read → refused
		await expect(chat.listMessages(conv.id, OUTSIDER, { limit: 10 })).rejects.toThrow(/Forbidden/);

		// sendMessage: write → refused (identity is server-side, no spoof)
		await expect(
			chat.sendMessage({ conversationId: conv.id, authorId: OUTSIDER, content: 'intrusion' })
		).rejects.toThrow(/Forbidden/);

		// markRead: state mutation → refused
		await expect(chat.markRead(conv.id, OUTSIDER)).rejects.toThrow(/Forbidden/);

		// listConversations: the outsider does not see the conversation at all
		const theirs = await chat.listConversations(OUTSIDER);
		expect(theirs.find((c) => c.id === conv.id)).toBeUndefined();
	});

	it('the last-message helper is not exposed as an unguarded public method', () => {
		// The public API surface is exactly the documented methods; helpers
		// backing listConversations must NOT be reachable without membership.
		const api = Object.keys(chat).sort();
		expect(api).toEqual(['createConversation', 'listConversations', 'listMessages', 'markRead', 'sendMessage']);
		expect((chat as any).getLastMessage).toBeUndefined();
		expect((chat as any).unreadCount).toBeUndefined();
	});
});
