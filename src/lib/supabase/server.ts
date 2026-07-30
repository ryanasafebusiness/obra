import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_url_here') {
    // Return a mock client for build time
    const mockResponse = { data: null, error: null, count: null }
    const mockAuth = {
      getUser: async () => ({ data: { user: null }, error: null }),
      exchangeCodeForSession: async () => ({ error: null }),
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
    })
    return { auth: mockAuth, from: mockFrom } as unknown as ReturnType<typeof createServerClient>
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  })
}
