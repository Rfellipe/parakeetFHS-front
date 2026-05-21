import { env } from '../config/env'
import type { ApiServices } from './contracts'
import { createHttpApiServices } from './adapters/httpApiAdapter'
import { mockApiServices } from './adapters/mockApiAdapter'

export const apiClient: ApiServices =
  env.useMockApi || !env.apiBaseUrl
    ? mockApiServices
    : createHttpApiServices(env.apiBaseUrl)
