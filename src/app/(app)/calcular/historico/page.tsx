import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CALCULATOR_MODULES } from '@/lib/constants'
import { ArrowLeft, History } from 'lucide-react'
import type { Calculation } from '@/types/database'

export default async function HistoricoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: calculations } = await supabase
    .from('calculations')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const items = (calculations || []) as Calculation[]

  return (
    <div className="px-5 pt-8 pb-8 max-w-lg mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/calcular" className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Histórico de cálculos</h1>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((calc) => {
            const modulo = CALCULATOR_MODULES.find((m) => m.id === calc.tipo)
            const custo = (calc.resultado as { custo_total_materiais?: number })?.custo_total_materiais

            return (
              <div key={calc.id} className="floating-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl flex-shrink-0">
                  {modulo?.emoji || '📐'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{calc.nome}</p>
                  <p className="text-xs text-slate-400">
                    {modulo?.nome || calc.tipo} · {formatDate(calc.created_at)}
                  </p>
                </div>
                {typeof custo === 'number' && (
                  <p className="font-bold text-slate-800 flex-shrink-0">{formatCurrency(custo)}</p>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="floating-card p-10 text-center">
          <History className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Sem cálculos guardados</h3>
          <p className="text-sm text-slate-500 mb-6">Os cálculos que guardar em cada calculadora aparecem aqui.</p>
          <Link href="/calcular" className="px-6 py-3 rounded-full btn-primary-gradient font-bold shadow-md text-white inline-block">
            Fazer um cálculo
          </Link>
        </div>
      )}
    </div>
  )
}
