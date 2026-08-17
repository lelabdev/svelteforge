import { db } from '$lib/server/db';
import {
	conversations,
	conversationParticipants,
	messages,
	messageReads
} from './schema';
import { desc, eq, and, inArray } from 'drizzle-orm';

/**
 * SvelteForge chat (#233) — composable app chat.
 *
 * Membership is the security rule (#281): every PUBLIC read/write method
 * verifies server-side that the caller is a participant. Helpers backing the
 * public API (last message, unread counts) are module-private and equally
 * membership-checked — an outsider cannot read anything through the service.
 *
 * Works without realtime (classic refetch). If @svforge/realtime is installed,
 * publish `message.created` on `conversation:{id}` after persist (optional).
 */

// ── private helpers (NOT part of the public API) ───────────────────────────

/** Server-side membership check — throws if the user cannot access. */
async function assertMember(conversationId: string, userId: string): Promise<void> {
	const rows = await db
		.select({ conversationId: conversationParticipants.conversationId })
		.from(conversationParticipants)
		.where(
			and(
				eq(conversationParticipants.conversationId, conversationId),
				eq(conversationParticipants.userId, userId)
			)
		);
	if (rows.length === 0) {
		throw new Error('Forbidden: you are not a participant of this conversation');
	}
}

/** Last message of a conversation, membership-checked (internal helper). */
async function getLastMessage(conversationId: string, userId: string) {
	await assertMember(conversationId, userId);
	const rows = await db
		.select()
		.from(messages)
		.where(eq(messages.conversationId, conversationId))
		.orderBy(desc(messages.createdAt))
		.limit(1);
	return rows[0] ?? null;
}

/**
 * Unread count for a user (messages without a read entry BY THAT USER).
 *
 * #281: the read state is PER USER — filtering messageReads only by message
 * ids made a message read by A count as read for everyone in the
 * conversation. The userId filter is mandatory.
 */
async function unreadCount(conversationId: string, userId: string): Promise<number> {
	await assertMember(conversationId, userId);
	const msgs = await db
		.select({ id: messages.id })
		.from(messages)
		.where(eq(messages.conversationId, conversationId));
	if (msgs.length === 0) return 0;
	const read = await db
		.select({ messageId: messageReads.messageId })
		.from(messageReads)
		.where(
			and(
				inArray(
					messageReads.messageId,
					msgs.map((m) => m.id)
				),
				eq(messageReads.userId, userId)
			)
		);
	const readSet = new Set(read.map((r) => r.messageId));
	return msgs.filter((m) => !readSet.has(m.id)).length;
}

// ── public API ──────────────────────────────────────────────────────────────

export const chat = {
	/** Create a conversation with participants (creator included). */
	async createConversation(input: { participantIds: string[]; type?: 'direct' | 'group' }) {
		const ids = [...new Set([...input.participantIds])];
		if (ids.length < 2) throw new Error('A conversation needs at least 2 participants');
		return db.transaction(async (tx) => {
			const [conv] = await tx
				.insert(conversations)
				.values({ type: input.type ?? 'direct', createdAt: new Date() })
				.returning();
			for (const userId of ids) {
				await tx.insert(conversationParticipants).values({
					conversationId: conv.id,
					userId,
					joinedAt: new Date()
				});
			}
			return conv;
		});
	},

	/** Conversations of a user, with last message + per-user unread count. */
	async listConversations(userId: string) {
		const convs = await db
			.select({ conversationId: conversationParticipants.conversationId })
			.from(conversationParticipants)
			.where(eq(conversationParticipants.userId, userId));
		if (convs.length === 0) return [];
		const convIds = convs.map((c) => c.conversationId);
		const rows = await db
			.select({
				id: conversations.id,
				type: conversations.type,
				createdAt: conversations.createdAt
			})
			.from(conversations)
			.where(inArray(conversations.id, convIds))
			.orderBy(desc(conversations.createdAt));
		const out = [];
		for (const row of rows) {
			const last = await getLastMessage(row.id, userId);
			const unread = await unreadCount(row.id, userId);
			out.push({ ...row, lastMessage: last, unreadCount: unread });
		}
		return out;
	},

	/** Paginated messages of a conversation (membership-checked). */
	async listMessages(
		conversationId: string,
		userId: string,
		opts: { limit?: number; offset?: number } = {}
	) {
		await assertMember(conversationId, userId);
		return db
			.select()
			.from(messages)
			.where(eq(messages.conversationId, conversationId))
			.orderBy(desc(messages.createdAt))
			.limit(opts.limit ?? 50)
			.offset(opts.offset ?? 0);
	},

	/** Send a message as the current author (server-side identity, no spoof). */
	async sendMessage(input: { conversationId: string; authorId: string; content: string }) {
		if (!input.content?.trim()) throw new Error('Message content is required');
		await assertMember(input.conversationId, input.authorId);
		const [row] = await db
			.insert(messages)
			.values({
				conversationId: input.conversationId,
				authorId: input.authorId,
				content: input.content.trim(),
				createdAt: new Date()
			})
			.returning();
		return row;
	},

	/** Mark messages of a conversation as read for a user. */
	async markRead(conversationId: string, userId: string) {
		await assertMember(conversationId, userId);
		const msgs = await db
			.select({ id: messages.id })
			.from(messages)
			.where(eq(messages.conversationId, conversationId));
		for (const m of msgs) {
			await db
				.insert(messageReads)
				.values({ messageId: m.id, userId, readAt: new Date() })
				.onConflictDoNothing();
		}
	}
};
