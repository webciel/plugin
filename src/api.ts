import { Logger } from '#framework/logger'

export interface ApiInitOptions {
  baseUrl: string
  headers?: Record<string, string>
  name?: string
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  useCache?: boolean
}

export interface ApiResponse<T> {
  method: string
  url: string
  options: RequestInit
  data: T
  status: number
  reload: () => Promise<ApiResponse<T>>
}

export class Api {
  private logger: Logger
  private baseUrl: string
  private headers: Record<string, string>

  constructor({ baseUrl, headers = {}, name }: ApiInitOptions) {
    this.logger = new Logger(name ?? 'API')
    this.logger.log('init', { baseUrl, headers })
    this.baseUrl = baseUrl
    this.headers = headers
  }

  async request<T = unknown>(
    endpoint: string,
    rawOptions: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body = null, headers = {}, useCache = true } = rawOptions
    const url = `${this.baseUrl}${endpoint}`
    const options: RequestInit = {
      method,
      headers: {
        ...this.headers,
        ...headers,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : null,
    }
  
    this.logger.log('request', { method, url, options })
  
    const cacheKey = `[webciel-plugin:API:${url}]`
    const cachedData = await this.getCacheData<T>(cacheKey, useCache)
    if (cachedData) {
      return {
        method,
        url,
        options,
        data: cachedData,
        status: 200,
        reload: () => this.request<T>(endpoint, { ...rawOptions, useCache: false }),
      }
    }
  
    try {
      const response = await fetch(url, options)
      const status = response.status
  
      if (!response.ok) throw new Error(`HTTP Error: ${status}`)
  
      const json = await response.json()
      const data = json.data as T
  
      if (useCache) {
        sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }))
      }
  
      return {
        method,
        url,
        options,
        data,
        status,
        reload: () => this.request<T>(endpoint, { ...rawOptions, useCache: false }),
      }
    } catch (error) {
      this.logger.error('request', `Error [${method}]`, { url, error })
      throw error
    }
  }
  

  private async getCacheData<T>(cacheKey: string, useCache: boolean): Promise<T | null> {
    if (!useCache) return null

    const cachedItem = sessionStorage.getItem(cacheKey)
    if (cachedItem) {
      try {
        const { data, timestamp } = JSON.parse(cachedItem)
        const cacheDuration = 60 * 60 * 1000 // 1h
        if (Date.now() - timestamp < cacheDuration) {
          this.logger.log('getCacheData', 'Returning cached data')
          return data as T
        }
        this.logger.log('getCacheData', 'Cache expired')
      } catch {
        this.logger.warn('getCacheData', 'Invalid cache format')
      }
    }

    return null
  }

  async fetch<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    options: Omit<RequestOptions, 'method'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method, ...options })
  }

  async get<T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.fetch<T>('GET', endpoint, options)
  }

  async post<T = unknown>(endpoint: string, body: unknown, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.fetch<T>('POST', endpoint, { ...options, body })
  }

  async put<T = unknown>(endpoint: string, body: unknown, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.fetch<T>('PUT', endpoint, { ...options, body })
  }

  async delete<T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.fetch<T>('DELETE', endpoint, options)
  }
}
