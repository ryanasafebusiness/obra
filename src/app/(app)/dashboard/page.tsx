import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DASHBOARD_CARDS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { ChevronRight, TrendingUp } from 'lucide-react'
import type { Project } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Fetch projects in progress
  const { count: activeProjectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
    .eq('status', 'em_andamento')

  // Fetch recent projects
  const { data: recentProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Total dos orçamentos criados este mês
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: budgetsThisMonth } = await supabase
    .from('budgets')
    .select('total')
    .eq('user_id', user?.id)
    .gte('created_at', startOfMonth.toISOString())

  const totalOrcamentosMes = (budgetsThisMonth || []).reduce(
    (acc: number, b: { total: number }) => acc + (b.total || 0),
    0
  )

  const nome = profile?.nome || user?.user_metadata?.nome || user?.user_metadata?.full_name || 'Utilizador'

  return (
    <div className="px-5 pt-8 pb-8 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <p className="text-slate-500 text-sm font-medium mb-1">Bem-vindo de volta</p>
        <h1 className="text-3xl font-bold text-slate-800">
          {nome}
        </h1>
      </div>

      {/* Main Status Card */}
      <div className="floating-card p-5 mb-5 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Status atual</p>
            <h2 className="text-slate-800 font-bold text-lg">
              Você tem {activeProjectsCount || 0} obras em andamento
            </h2>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-orange-100 flex items-center justify-center relative">
            <div className="w-full h-full rounded-full border-4 border-primary border-t-transparent animate-spin" style={{ position: 'absolute' }}></div>
            <span className="text-primary font-bold text-lg">{activeProjectsCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Financial Card */}
      <div className="floating-card p-5 mb-8 bg-gradient-to-br from-slate-800 to-slate-900 border-none animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-slate-300 text-sm font-medium mb-1">Orçamentos deste mês</p>
            <h2 className="text-white font-bold text-3xl">{formatCurrency(totalOrcamentosMes)}</h2>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
            <TrendingUp className="w-5 h-5 text-orange-400" />
          </div>
        </div>
        <Link href="/orcamentos" className="w-full py-2.5 bg-white/10 hover:bg-white/20 transition-colors rounded-xl text-white text-sm font-medium flex items-center justify-center backdrop-blur-md">
          Ver relatórios
        </Link>
      </div>

      {/* Quick Services */}
      <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Serviços rápidos</h2>
        <div className="flex flex-wrap gap-3">
          {DASHBOARD_CARDS.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className="pill-button px-4 py-2.5 flex items-center gap-2 hover:border-primary/30 transition-colors"
            >
              <span className="text-lg">{card.emoji}</span>
              <span className="text-sm font-medium text-slate-700">{card.nome}</span>
            </Link>
          ))}
          <Link
            href="/orcamentos"
            className="pill-button px-4 py-2.5 flex items-center gap-2 hover:border-primary/30 transition-colors"
          >
            <span className="text-lg">📄</span>
            <span className="text-sm font-medium text-slate-700">Orçamento</span>
          </Link>
        </div>
      </div>

      {/* Recent Works */}
      <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            Obras recentes
          </h2>
          <Link href="/obras" className="text-sm text-primary font-medium flex items-center">
            Ver todas <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentProjects && recentProjects.length > 0 ? (
            recentProjects.map((project: Project) => (
              <Link
                key={project.id}
                href={`/obras/${project.id}`}
                className="floating-card p-4 flex items-center gap-4 hover:border-primary/30 transition-colors"
              >
                <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🏗️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{project.nome}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      project.status === 'em_andamento' ? 'bg-emerald-500' :
                      project.status === 'orcamento' ? 'bg-orange-500' : 'bg-slate-400'
                    }`} />
                    <span className="text-xs font-medium text-slate-500 capitalize">
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </Link>
            ))
          ) : (
            <>
              {/* Placeholder Mock Data as requested by user if no real data */}
              <div className="floating-card p-4 flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0 text-orange-500">
                  <span className="text-2xl">🏢</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">Apartamento Lisboa</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-xs font-medium text-slate-500">Orçamento</span>
                  </div>
                </div>
              </div>

              <div className="floating-card p-4 flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-500">
                  <span className="text-2xl">🏠</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">Moradia Porto</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-slate-500">Em andamento</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
