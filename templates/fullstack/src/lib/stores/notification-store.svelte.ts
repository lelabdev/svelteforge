/**
 * Notification Store — Svelte 5 rune-based
 *
 * Manages in-app notifications with mock data.
 * Will be replaced by real API calls later.
 */

export interface Notification {
	id: string;
	title: string;
	message: string;
	target: 'all' | 'admins' | 'user';
	targetUserId?: string;
	createdAt: Date;
	read: boolean;
}

// --- Admin notification type (for the admin page table) ---
export interface AdminNotification {
	id: string;
	title: string;
	message: string;
	target: 'all' | 'admins' | 'user';
	targetUserId?: string;
	createdAt: Date;
	status: 'sent' | 'read';
}

let notifications = $state<Notification[]>([]);
let adminNotifications = $state<AdminNotification[]>([]);

// --- Derived ---
let unreadCount = $derived(notifications.filter((n) => !n.read).length);

// --- Mock data ---
const mockNotifications: Notification[] = [
	{
		id: '1',
		title: 'Welcome to SvelteForge',
		message: 'Your account has been set up successfully. Explore the dashboard to get started.',
		target: 'all',
		createdAt: new Date('2026-05-07T20:00:00'),
		read: false
	},
	{
		id: '2',
		title: 'New feature available',
		message: 'Check out the new admin dashboard with improved analytics.',
		target: 'all',
		createdAt: new Date('2026-05-06T14:30:00'),
		read: true
	},
	{
		id: '3',
		title: 'Maintenance scheduled',
		message: 'System maintenance on May 10th at 2AM UTC. Expect brief downtime.',
		target: 'admins',
		createdAt: new Date('2026-05-05T09:00:00'),
		read: false
	},
	{
		id: '4',
		title: 'Profile tips',
		message: 'Complete your profile to unlock all features and improve your experience.',
		target: 'all',
		createdAt: new Date('2026-05-04T16:45:00'),
		read: true
	},
	{
		id: '5',
		title: 'Security update',
		message: 'We have strengthened password requirements. Please review your settings.',
		target: 'all',
		createdAt: new Date('2026-05-03T11:20:00'),
		read: false
	},
	{
		id: '6',
		title: 'Weekly report ready',
		message: 'Your weekly activity summary is now available in the dashboard.',
		target: 'all',
		createdAt: new Date('2026-05-02T08:00:00'),
		read: true
	},
	{
		id: '7',
		title: 'Admin: New user registrations',
		message: '15 new users signed up this week. Review their profiles in the Users panel.',
		target: 'admins',
		createdAt: new Date('2026-05-01T13:00:00'),
		read: false
	}
];

const mockAdminNotifications: AdminNotification[] = [
	{
		id: 'a1',
		title: 'Welcome to SvelteForge',
		message: 'Your account has been set up successfully.',
		target: 'all',
		createdAt: new Date('2026-05-07T20:00:00'),
		status: 'sent'
	},
	{
		id: 'a2',
		title: 'New feature available',
		message: 'Check out the new admin dashboard.',
		target: 'all',
		createdAt: new Date('2026-05-06T14:30:00'),
		status: 'read'
	},
	{
		id: 'a3',
		title: 'Maintenance scheduled',
		message: 'System maintenance on May 10th at 2AM UTC.',
		target: 'admins',
		createdAt: new Date('2026-05-05T09:00:00'),
		status: 'sent'
	}
];

let initialized = false;

// --- Functions ---

export function getNotifications(): Notification[] {
	return notifications;
}

export function getUnreadCount(): number {
	return unreadCount;
}

export function getAdminNotifications(): AdminNotification[] {
	return adminNotifications;
}

export function fetchNotifications(): void {
	if (!initialized) {
		notifications = [...mockNotifications];
		adminNotifications = [...mockAdminNotifications];
		initialized = true;
	}
}

export function markAsRead(id: string): void {
	notifications = notifications.map((n) =>
		n.id === id ? { ...n, read: true } : n
	);
}

export function markAllRead(): void {
	notifications = notifications.map((n) => ({ ...n, read: true }));
}

export function dismissNotification(id: string): void {
	notifications = notifications.filter((n) => n.id !== id);
}

export function createAdminNotification(opts: {
	title: string;
	message: string;
	target: 'all' | 'admins' | 'user';
	targetUserId?: string;
}): AdminNotification {
	const newNotif: AdminNotification = {
		id: crypto.randomUUID(),
		title: opts.title,
		message: opts.message,
		target: opts.target,
		targetUserId: opts.targetUserId,
		createdAt: new Date(),
		status: 'sent'
	};
	adminNotifications = [newNotif, ...adminNotifications];

	// Also push to user notifications (so the bell sees it)
	const userNotif: Notification = {
		id: newNotif.id,
		title: opts.title,
		message: opts.message,
		target: opts.target,
		targetUserId: opts.targetUserId,
		createdAt: new Date(),
		read: false
	};
	notifications = [userNotif, ...notifications];

	return newNotif;
}

/**
 * Returns a human-readable "time ago" string.
 */
export function timeAgo(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHr = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHr / 24);

	if (diffSec < 60) return 'just now';
	if (diffMin < 60) return `${diffMin}m ago`;
	if (diffHr < 24) return `${diffHr}h ago`;
	if (diffDay < 7) return `${diffDay}d ago`;
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
	});
}
