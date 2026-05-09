import type { PageServerLoad } from './$types';

interface MockUser {
	id: string;
	name: string;
	email: string;
	role: 'admin' | 'user';
	createdAt: string;
}

// Mock data — replace with real DB/service layer when available
const mockUsers: MockUser[] = [
	{ id: 'usr_01', name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', createdAt: '2024-11-02T08:30:00Z' },
	{ id: 'usr_02', name: 'Bob Smith', email: 'bob@example.com', role: 'user', createdAt: '2024-11-05T14:12:00Z' },
	{ id: 'usr_03', name: 'Carol Davis', email: 'carol@example.com', role: 'user', createdAt: '2024-11-08T09:45:00Z' },
	{ id: 'usr_04', name: 'David Wilson', email: 'david@example.com', role: 'admin', createdAt: '2024-11-12T16:20:00Z' },
	{ id: 'usr_05', name: 'Eva Martinez', email: 'eva@example.com', role: 'user', createdAt: '2024-11-15T11:05:00Z' },
	{ id: 'usr_06', name: 'Frank Brown', email: 'frank@example.com', role: 'user', createdAt: '2024-11-18T13:30:00Z' },
	{ id: 'usr_07', name: 'Grace Lee', email: 'grace@example.com', role: 'user', createdAt: '2024-12-01T10:00:00Z' },
	{ id: 'usr_08', name: 'Henry Taylor', email: 'henry@example.com', role: 'admin', createdAt: '2024-12-03T15:45:00Z' },
	{ id: 'usr_09', name: 'Iris Anderson', email: 'iris@example.com', role: 'user', createdAt: '2024-12-07T08:15:00Z' },
	{ id: 'usr_10', name: 'Jack Thomas', email: 'jack@example.com', role: 'user', createdAt: '2024-12-10T12:00:00Z' },
	{ id: 'usr_11', name: 'Karen Jackson', email: 'karen@example.com', role: 'user', createdAt: '2025-01-02T09:30:00Z' },
	{ id: 'usr_12', name: 'Leo White', email: 'leo@example.com', role: 'user', createdAt: '2025-01-05T14:00:00Z' },
	{ id: 'usr_13', name: 'Mia Harris', email: 'mia@example.com', role: 'admin', createdAt: '2025-01-08T10:30:00Z' },
	{ id: 'usr_14', name: 'Noah Clark', email: 'noah@example.com', role: 'user', createdAt: '2025-01-12T16:45:00Z' },
	{ id: 'usr_15', name: 'Olivia Lewis', email: 'olivia@example.com', role: 'user', createdAt: '2025-01-15T11:20:00Z' }
];

export const load: PageServerLoad = async () => {
	return {
		users: mockUsers
	};
};
