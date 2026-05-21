const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined
const USE_MOCK_API = (import.meta.env.VITE_USE_MOCK_API as string | undefined) !== 'false'

export const env = {
  apiBaseUrl: API_BASE_URL,
  useMockApi: USE_MOCK_API,
}
