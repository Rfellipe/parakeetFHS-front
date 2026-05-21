import type { ApiServices } from '../contracts'

// Placeholder adapter for backend integration. Replace each method with your API routes.
export function createHttpApiServices(baseUrl: string): ApiServices {
  void baseUrl
  throw new Error(
    'HTTP adapter not implemented. Set VITE_USE_MOCK_API=true for now.'
  )
}
