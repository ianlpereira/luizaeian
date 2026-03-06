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
  buyer_email: string
  created_at: string
}
