/**
 * types.ts - Common types shared by all services
 *
 * Centralizes types to avoid duplication
 * and maintain a consistent architecture.
 */

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * Options for paginated user queries
 */
export interface UserQueryOptions {
	page?: number;
	limit?: number;
	search?: string;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	filter?: string;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

/**
 * Data to update for a user
 */
export interface UpdateUserData {
	name?: string;
	email?: string;
	image?: string;
}

// ============================================================================
// ADMIN USER TYPES
// ============================================================================

export interface UpdateUserAsAdminData {
	name?: string;
	email?: string;
}
