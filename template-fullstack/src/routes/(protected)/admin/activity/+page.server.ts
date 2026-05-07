import type { PageServerLoad } from './$types';

type ActionType =
	| 'user.login'
	| 'user.logout'
	| 'user.create'
	| 'user.update'
	| 'user.delete'
	| 'role.change'
	| 'settings.update'
	| 'notification.send'
	| 'export.data'
	| 'api.key.rotate';

interface ActivityEntry {
	id: string;
	timestamp: string;
	user: string;
	action: ActionType;
	details: string;
}

// Mock data — replace with real DB/service layer when available
const mockActivity: ActivityEntry[] = [
	{ id: 'act_01', timestamp: '2025-05-07T23:45:00Z', user: 'Alice Johnson', action: 'user.login', details: 'Logged in from 192.168.1.42 (Chrome/macOS)' },
	{ id: 'act_02', timestamp: '2025-05-07T23:30:00Z', user: 'David Wilson', action: 'role.change', details: 'Changed Bob Smith\'s role from "user" to "admin"' },
	{ id: 'act_03', timestamp: '2025-05-07T23:15:00Z', user: 'Mia Harris', action: 'settings.update', details: 'Updated site notification preferences' },
	{ id: 'act_04', timestamp: '2025-05-07T22:55:00Z', user: 'Henry Taylor', action: 'user.create', details: 'Created account for Oliver King (oliver@example.com)' },
	{ id: 'act_05', timestamp: '2025-05-07T22:40:00Z', user: 'Alice Johnson', action: 'export.data', details: 'Exported user data as CSV (15 records)' },
	{ id: 'act_06', timestamp: '2025-05-07T22:10:00Z', user: 'Bob Smith', action: 'user.login', details: 'Logged in from 10.0.0.15 (Firefox/Windows)' },
	{ id: 'act_07', timestamp: '2025-05-07T21:50:00Z', user: 'David Wilson', action: 'user.update', details: 'Updated profile email for Eva Martinez' },
	{ id: 'act_08', timestamp: '2025-05-07T21:30:00Z', user: 'Grace Lee', action: 'user.logout', details: 'Ended session after 2h 15m' },
	{ id: 'act_09', timestamp: '2025-05-07T21:00:00Z', user: 'Alice Johnson', action: 'notification.send', details: 'Sent maintenance notification to 8 users' },
	{ id: 'act_10', timestamp: '2025-05-07T20:45:00Z', user: 'Henry Taylor', action: 'api.key.rotate', details: 'Rotated API key for production environment' },
	{ id: 'act_11', timestamp: '2025-05-07T20:20:00Z', user: 'Mia Harris', action: 'user.delete', details: 'Deleted spam account spammer99@example.com' },
	{ id: 'act_12', timestamp: '2025-05-07T19:55:00Z', user: 'Carol Davis', action: 'user.login', details: 'Logged in from 172.16.0.8 (Safari/iOS)' },
	{ id: 'act_13', timestamp: '2025-05-07T19:30:00Z', user: 'David Wilson', action: 'role.change', details: 'Changed Grace Lee\'s role from "user" to "admin"' },
	{ id: 'act_14', timestamp: '2025-05-07T19:00:00Z', user: 'Alice Johnson', action: 'settings.update', details: 'Updated default theme to dark mode' },
	{ id: 'act_15', timestamp: '2025-05-07T18:30:00Z', user: 'Bob Smith', action: 'user.update', details: 'Changed own display name from "Robert" to "Bob"' },
	{ id: 'act_16', timestamp: '2025-05-07T18:00:00Z', user: 'Henry Taylor', action: 'export.data', details: 'Exported activity log for audit review (PDF)' },
	{ id: 'act_17', timestamp: '2025-05-07T17:30:00Z', user: 'Mia Harris', action: 'user.create', details: 'Created account for Chloe Adams (chloe@example.com)' },
	{ id: 'act_18', timestamp: '2025-05-07T17:00:00Z', user: 'Alice Johnson', action: 'user.logout', details: 'Ended session after 4h 30m' },
	{ id: 'act_19', timestamp: '2025-05-07T16:25:00Z', user: 'David Wilson', action: 'notification.send', details: 'Sent welcome email to 3 new users' },
	{ id: 'act_20', timestamp: '2025-05-07T16:00:00Z', user: 'Grace Lee', action: 'user.login', details: 'Logged in from 192.168.2.10 (Edge/Windows)' },
	{ id: 'act_21', timestamp: '2025-05-07T15:30:00Z', user: 'Henry Taylor', action: 'settings.update', details: 'Updated session timeout to 30 minutes' },
	{ id: 'act_22', timestamp: '2025-05-07T15:00:00Z', user: 'Alice Johnson', action: 'api.key.rotate', details: 'Rotated API key for staging environment' },
	{ id: 'act_23', timestamp: '2025-05-07T14:20:00Z', user: 'Mia Harris', action: 'user.update', details: 'Reset password for Jack Thomas' },
	{ id: 'act_24', timestamp: '2025-05-07T13:45:00Z', user: 'Bob Smith', action: 'user.logout', details: 'Ended session after 1h 05m' },
	{ id: 'act_25', timestamp: '2025-05-07T13:00:00Z', user: 'David Wilson', action: 'role.change', details: 'Changed Karen Jackson\'s role from "admin" to "user"' },
	{ id: 'act_26', timestamp: '2025-05-07T12:30:00Z', user: 'Alice Johnson', action: 'user.login', details: 'Logged in from 10.0.0.2 (Chrome/Linux)' },
	{ id: 'act_27', timestamp: '2025-05-07T11:45:00Z', user: 'Henry Taylor', action: 'export.data', details: 'Exported monthly analytics report (JSON)' },
	{ id: 'act_28', timestamp: '2025-05-07T11:00:00Z', user: 'Grace Lee', action: 'notification.send', details: 'Sent security alert to 2 users with expired passwords' },
	{ id: 'act_29', timestamp: '2025-05-07T10:15:00Z', user: 'Mia Harris', action: 'user.create', details: 'Created account for Liam Chen (liam@example.com)' },
	{ id: 'act_30', timestamp: '2025-05-07T09:30:00Z', user: 'Alice Johnson', action: 'settings.update', details: 'Enabled two-factor authentication requirement for admins' }
];

export const load: PageServerLoad = async () => {
	return {
		activities: mockActivity
	};
};
