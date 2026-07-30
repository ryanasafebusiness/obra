import { createClient } from '@/lib/supabase/server'
import OrcamentosClient from './OrcamentosClient'
import { redirect } from 'next/navigation'

export default async function OrcamentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: budgets }, { data: clients }, { data: profile }, { data: projects }] = await Promise.all([
    supabase
      .from('budgets')
      .select('*, client:clients(*), project:projects(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id),
    supabase
      .from('profiles')
      .select('plano')
      .eq('id', user.id)
      .single(),
    supabase
      .from('projects')
      .select('id, nome')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  ])

  return (
    <OrcamentosClient 
      initialBudgets={budgets as any || []} 
      initialClients={clients as any || []} 
      initialProjects={projects as any || []}
      userPlan={profile?.plano || 'gratuito'}
    />
  )
}
