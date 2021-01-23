/** Expected format for a list */
export interface List {
  /** Human readable name of the list */
  name: string
  /** Unique IDs associated with users that have access to the list */
  users?: string[]
}