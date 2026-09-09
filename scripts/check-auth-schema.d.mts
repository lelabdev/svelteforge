// Type declarations for check-auth-schema.mjs (consumed by vitest + tsc)

/**
 * @typedef {Object} ParsedColumn
 * @property {string} column
 * @property {string} drizzleType
 * @property {boolean} [primaryKey]
 * @property {boolean} [notNull]
 * @property {boolean} [hasDefault]
 * @property {string} [defaultLiteral]
 * @property {boolean} [unique]
 * @property {{ table: string, property: string, onDelete: string }} [references]
 */

/**
 * @typedef {Object} ParsedTable
 * @property {Record<string, ParsedColumn>} columns
 * @property {Array<Array<string>>} indexes
 */

/**
 * @typedef {Object} RuntimeField
 * @property {string} type
 * @property {boolean} [required]
 * @property {boolean} [unique]
 * @property {boolean} [hasDefault]
 * @property {unknown} [defaultValue]
 * @property {boolean} [defaultIsComputed]
 * @property {string} [fieldName]
 * @property {{ model: string, field: string, onDelete: string }} [references]
 * @property {boolean} [implicitPrimaryKey]
 */

/**
 * @typedef {Object} RuntimeModel
 * @property {Record<string, { fields: Record<string, RuntimeField>, order?: number, indexes?: unknown[] }>} models
 */

/**
 * @typedef {Object} DriftEntry
 * @property {string} kind
 * @property {string} table
 * @property {string} [column]
 * @property {string} [detail]
 */

/**
 * @param {string} _source
 * @returns {Record<string, ParsedTable & Record<string, unknown>>}
 */
export function parseDrizzleTables(_source) { /* implemented in .mjs */ }

/**
 * @param {Record<string, unknown>} _runtimeSchema
 * @returns {Record<string, { fields: Record<string, RuntimeField>, order?: number, indexes?: unknown[] }> & Record<string, unknown>}
 */
export function normalizeRuntimeSchema(_runtimeSchema) { /* implemented in .mjs */ }

/**
 * @param {Record<string, { fields: Record<string, RuntimeField> }>} _runtimeModel
 * @param {string} _committedSource
 * @param {Record<string, string[]>} _allowlist
 * @returns {{ drift: DriftEntry[] }}
 */
export function compareSchemas(_runtimeModel, _committedSource, _allowlist) { /* implemented in .mjs */ }
