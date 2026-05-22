import { env } from '../config/env'
import { CreateHttpApiServices } from './adapters/httpApiAdapter'

export const apiClient = new CreateHttpApiServices(env.apiBaseUrl || '')
