export interface Companion {
  name: string
}

export interface RsvpEntry {
  id: string
  full_name: string
  email: string
  status: 'confirmed' | 'declined'
  companions: Companion[]
  created_at: string
}

export type RsvpStatus = 'confirmed' | 'declined'
