'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_url_here') {
    // Return a mock client for build time / when credentials aren't configured
    const mockResponse = { data: null, error: null, count: null }
    const mockAuth = {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase não configurado' } }),
      signInWithOAuth: async () => ({ data: null, error: { message: 'Supabase não configurado' } }),
      signUp: async () => ({ data: { user: null }, error: { message: 'Supabase não configurado' } }),
      signOut: async () => ({ error: null }),
    }
    const mockFrom = () => ({
      select: () => ({
        eq: () => ({
          single: async () => mockResponse,
          order: () => ({ limit: async () => mockResponse }),
          ...mockResponse,
        }),
        order: () => ({
          limit: async () => mockResponse,
          ...mockResponse,
        }),
        ...mockResponse,
      }),
      insert: async () => mockResponse,
      update: () => ({ eq: async () => mockResponse }),
      upsert: async () => mockResponse,
      delete: () => ({ eq: async () => mockResponse }),
    })
    return { auth: mockAuth, from: mockFrom } as unknown as ReturnType<typeof createBrowserClient>
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
