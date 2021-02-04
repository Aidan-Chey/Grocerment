import { Item } from "./item.model";

/** Expected format for a list */
export interface List {
  id?: string
  /** Human readable name of the list */
  name: string
  /** Unique IDs associated with users that have access to the list */
  users: string[]
  /** Items in the list */
  items: Item[]
}
