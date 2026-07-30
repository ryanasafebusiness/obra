import { createClient } from '@/lib/supabase/server'
import OrcamentosClient from './OrcamentosClient'
import { redirect } from 'next/navigation'

export default async function OrcamentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: budgets }, { data: clients }] = await Promise.all([
    supabase
      .from('budgets')
      .select('*, client:clients(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id),
  ])

  return (
    <OrcamentosClient 
      initialBudgets={budgets as any || []} 
      initialClients={clients as any || []} 
    />
  )
}
