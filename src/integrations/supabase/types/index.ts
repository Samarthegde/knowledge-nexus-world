// Re-export all types from the modular structure
export type { Json, Database } from './database'
export type { Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes } from './helpers'
export { Constants } from './constants'

// Legacy exports for backward compatibility
export type * from './database'
export type * from './helpers'