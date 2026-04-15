import type { Auth } from 'better-auth';
import type pino from 'pino';

declare global {
	namespace App {
		interface Locals {
			auth: Auth;
			logger: pino.Logger;
			responseStatus?: number;
			rateLimit?: {
				limit: number;
				remaining: number;
				reset: Date;
			};
			session: {
				id: string;
				expiresAt: Date;
				ipAddress?: string;
				userAgent?: string;
			} | null;
			user: {
				id: string;
				email: string;
				emailVerified: boolean;
				name: string;
				image?: string | null;
				role?: string | null;
				banned?: boolean | null;
				banReason?: string | null;
				banExpires?: Date | null;
			} | null;
		}
	}
}

declare module 'better-auth' {
	interface Session {
		user: {
			id: string;
			createdAt: Date;
			updatedAt: Date;
			email: string;
			emailVerified: boolean;
			name: string;
			image?: string | null;
			role?: string | null;
			banned?: boolean | null;
			banReason?: string | null;
			banExpires?: Date | null;
		};
	}
}

export {};
