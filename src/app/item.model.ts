export interface Item {
  id?: string
  name: string
  category: string
  measurement: string | null
  quantity: string | null
  count: number
  estimated: boolean
  obtained: boolean
}
