/** Expected format for a list item */
export interface Item {
  /** ID of the item's document in the items collection */
  id?: string
  /** Visual identifier for the item */
  name: string
  /** Name of the category the item should be placed under */
  category: string
  /** Unit the item is measured in */
  measurement: string | null
  /** How much of the unit of measurement should each item have */
  amount: string | null
  /** How reliable/accurate the quantity of measurement should be */
  estimated: boolean
  /** The number of the item (number needed/have) */
  quantity: number
  /** Whether the item is already possessed or not */
  obtained: boolean
}
