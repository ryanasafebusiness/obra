import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BUDGET_STATUS } from '@/lib/constants'
import { ArrowLeft, MapPin, Phone, Wrench, Calendar, ReceiptText } from 'lucide-react'
import { ObraStatusSelect } from '@/components/ObraStatusSelect'
import type { Budget, Client, Project } from '@/types/database'

type ProjectDetail = Project & {
  clients: Client | null
  budgets: Budget[]
}

export default async function ObraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: project } = await supabase
    .from('projects')
    .select('*, clients(*), budgets(*)')
    .eq('id', id)
    .eq('user_id', user?.id)
    .single()

  if (!project) {
    notFound()
  }

  const obra = project as ProjectDetail

  return (
    <div className="px-5 pt-8 pb-8 max-w-lg mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/obras" className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 truncate">{obra.nome}</h1>
      </div>

      <div className="floating-card p-6 mb-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Estado</p>
          <ObraStatusSelect projectId={obra.id} status={obra.status} />
        </div>

        {obra.clients && (
          <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
            <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-400">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Cliente</p>
              <p className="font-bold text-slate-800">{obra.clients.nome}</p>
              {obra.clients.morada && (
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" /> {obra.clients.morada}
                </p>
              )}
            </div>
          </div>
        )}

        {obra.tipo_servico && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Serviço</p>
              <p className="font-bold text-slate-800">{obra.tipo_servico}</p>
            </div>
          </div>
        )}

        {(obra.data_inicio || obra.data_fim) && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Datas</p>
              <p className="font-bold text-slate-800">
                {obra.data_inicio ? formatDate(obra.data_inicio) : '—'}
                {' → '}
                {obra.data_fim ? formatDate(obra.data_fim) : '—'}
              </p>
            </div>
          </div>
        )}

        {obra.notas && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Notas</p>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{obra.notas}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Orçamentos da obra</h2>
      </div>

      {obra.budgets && obra.budgets.length > 0 ? (
        <div className="space-y-3">
          {obra.budgets.map((budget) => {
            const status = BUDGET_STATUS[budget.status as keyof typeof BUDGET_STATUS] || BUDGET_STATUS.rascunho
            return (
              <div key={budget.id} className="floating-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{budget.numero}</p>
                  <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-lg font-black text-slate-800">{formatCurrency(budget.total)}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="floating-card p-8 text-center">
          <ReceiptText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 mb-3">Ainda não há orçamentos associados a esta obra.</p>
          <Link href="/orcamentos" className="text-sm text-primary font-medium hover:underline">
            Criar orçamento →
          </Link>
        </div>
      )}
    </div>
  )
}
