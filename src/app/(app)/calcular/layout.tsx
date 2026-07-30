import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lock } from 'lucide-react'

export default async function CalcularLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('plano').eq('id', user.id).single()

  if (profile?.plano === 'gratuito') {
    return (
      <div className="px-5 pt-12 pb-8 max-w-lg mx-auto w-full text-center animate-slide-up">
        <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-orange-100">
          <Lock className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-3">Funcionalidade Premium</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Os cálculos de materiais (pladur, betão, piso, pintura, etc) são funcionalidades exclusivas para contas com plano ativo. 
          Atualize agora e poupe horas de trabalho em cada obra!
        </p>
        <Link href="/ajustes/planos" className="w-full block py-4 rounded-2xl btn-primary-gradient text-white font-bold shadow-lg shadow-orange-500/30 text-lg hover:shadow-orange-500/50 transition-shadow">
          Ver Planos
        </Link>
        <Link href="/dashboard" className="w-full block mt-4 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors">
          Voltar ao Início
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
