/**
 * Generic paginated response from the API.
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

/**
 * Generic API error shape.
 */
export interface ApiError {
  detail: string
}

/**
 * Query params for paginated endpoints.
 */
export interface PaginationParams {
  page?: number
  size?: number
}
