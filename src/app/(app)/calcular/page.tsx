import Link from 'next/link'
import { History } from 'lucide-react'
import { CALCULATOR_MODULES } from '@/lib/constants'

export default function CalcularPage() {
  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto w-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calculadoras</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione o tipo de cálculo
          </p>
        </div>
        <Link
          href="/calcular/historico"
          className="flex items-center gap-1.5 text-sm text-primary font-medium mt-1"
        >
          <History className="w-4 h-4" /> Histórico
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {CALCULATOR_MODULES.map((mod, index) => (
          <Link
            key={mod.id}
            href={mod.href}
            className="card-hover animate-slide-up"
            style={{ animationDelay: `${0.05 * index}s` }}
          >
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${mod.cor} p-5 flex items-center gap-4`}>
              <div className="absolute right-4 text-6xl opacity-15">
                {mod.emoji}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl backdrop-blur-sm">
                {mod.emoji}
              </div>
              <div className="relative z-10">
                <p className="text-white font-bold text-lg">{mod.nome}</p>
                <p className="text-white/70 text-sm">{mod.descricao}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
