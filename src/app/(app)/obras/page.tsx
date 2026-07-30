import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, MapPin, Wrench, Package, ArrowRight, HardHat } from 'lucide-react'
import type { Project } from '@/types/database'

type ProjectWithRelations = Project & {
  clients: { nome: string; morada: string | null } | null
  budgets: { total: number }[]
}

export default async function ObrasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      clients (
        nome,
        morada
      ),
      budgets (
        total
      )
    `)
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="px-5 pt-8 pb-8 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Obras
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Gira os seus projetos ativos</p>
        </div>
        <Link
          href="/obras/nova"
          className="w-12 h-12 flex items-center justify-center rounded-2xl btn-primary-gradient shadow-lg shadow-orange-500/30 text-white"
        >
          <Plus className="w-6 h-6" />
        </Link>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projects && projects.length > 0 ? (
          (projects as ProjectWithRelations[]).map((project, i) => {
            const statusColor = 
              project.status === 'em_andamento' ? 'bg-emerald-500 shadow-emerald-500/20' :
              project.status === 'orcamento' ? 'bg-orange-500 shadow-orange-500/20' : 'bg-slate-400 shadow-slate-400/20'
            const statusBg = 
              project.status === 'em_andamento' ? 'bg-emerald-50 text-emerald-700' :
              project.status === 'orcamento' ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-700'
            const total = project.budgets?.[0]?.total || 0

            return (
              <Link 
                key={project.id} 
                href={`/obras/${project.id}`}
                className="block floating-card overflow-hidden hover:border-primary/30 transition-all card-hover animate-slide-up"
                style={{ animationDelay: `${0.1 * (i + 1)}s` }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{project.nome}</h3>
                      {project.clients?.morada && (
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {project.clients.morada}
                        </p>
                      )}
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusBg}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${statusColor} shadow-sm`} />
                      {project.status.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="space-y-2.5 mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <span className="text-slate-500">Serviço:</span>
                      <span className="font-semibold text-slate-700">{project.tipo_servico || 'Não especificado'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <span className="text-slate-500">Materiais:</span>
                      <span className="font-semibold text-slate-700">Ver lista completa</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Valor Estimado</p>
                    <p className="text-lg font-black text-slate-800">
                      {total > 0 ? `€${total.toFixed(2)}` : 'Por orçamentar'}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="text-center p-10 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <HardHat className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Ainda não tem obras</h3>
            <p className="text-sm text-slate-500 mb-6">Registe as suas obras para gerir materiais, orçamentos e serviços de forma organizada.</p>
            <Link href="/obras/nova" className="inline-block px-6 py-3 rounded-full btn-primary-gradient font-bold shadow-md text-white">
              Nova Obra
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
