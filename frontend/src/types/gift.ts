export interface Gift {
  id: string
  title: string
  price: number
  image_url: string | null
  category: string
  stock_limit: number
  purchased: boolean
  created_at: string
}

export interface GiftPurchase {
  id: string
  gift_id: string
  buyer_name: string
  message: string | null
  amount: number | null
  created_at: string
}

export type GiftSortOrder = 'asc' | 'desc'

export interface GiftFilters {
  sortOrder: GiftSortOrder
  category?: string
}

export interface GiftPurchasePayload {
  gift_id: string
  buyer_name: string
  message?: string
  amount?: number
}
