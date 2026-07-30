'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Check, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import Link from 'next/link'

export default function PlanosPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)
  const [checkoutResult, setCheckoutResult] = useState<'sucesso' | 'cancelado' | null>(null)

  useEffect(() => {
    fetchProfile()

    const checkout = new URLSearchParams(window.location.search).get('checkout')
    if (checkout === 'sucesso' || checkout === 'cancelado') {
      setCheckoutResult(checkout)
      router.replace('/ajustes/planos')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (data) {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (plano: 'pro' | 'empresa') => {
    setUpgrading(plano)
    setUpgradeError(null)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível iniciar o pagamento.')
      }

      // eslint-disable-next-line react-hooks/immutability
      window.location.href = data.url
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : 'Erro ao iniciar o pagamento.')
      setUpgrading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const planos = [
    {
      id: 'pro',
      nome: 'Pro',
      preco: '9,99€/mês',
      features: ['Cálculos ilimitados', 'Clientes ilimitados', 'PDFs', 'Histórico completo', 'Banco de materiais'],
      destaque: true,
    },
    {
      id: 'empresa',
      nome: 'Empresa',
      preco: '29,99€/mês',
      features: ['Tudo do Pro', 'Vários trabalhadores', 'Gestão de equipa', 'Obras ilimitadas'],
    },
  ]

  const semPlanoAtivo = profile?.plano !== 'pro' && profile?.plano !== 'empresa'

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto w-full animate-slide-right">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ajustes" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Plano e faturação</h1>
      </div>

      {checkoutResult === 'sucesso' && (
        <div className="mb-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-sm font-medium px-4 py-3 text-center animate-slide-down">
          Pagamento confirmado! O seu plano será atualizado em instantes.
        </div>
      )}
      {checkoutResult === 'cancelado' && (
        <div className="mb-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-3 text-center animate-slide-down">
          Pagamento cancelado. Pode tentar novamente quando quiser.
        </div>
      )}

      {semPlanoAtivo && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 px-3 py-2.5 text-center mb-4">
          <p className="text-xs font-semibold text-primary">Sem plano ativo</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Comece um teste grátis de 14 dias — só pedimos o cartão para ativar.</p>
        </div>
      )}

      <div className="space-y-4">
        {planos.map((plano) => (
          <div
            key={plano.id}
            className={`rounded-2xl p-5 border ${
              profile?.plano === plano.id
                ? 'border-primary bg-primary/5'
                : plano.destaque
                  ? 'border-primary/30 glass'
                  : 'border-border-color glass'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-foreground">{plano.nome}</h4>
                {plano.destaque && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-bold tracking-wide">POPULAR</span>
                )}
              </div>
              {profile?.plano === plano.id ? (
                <p className="text-lg font-bold text-primary">{plano.preco}</p>
              ) : (
                <div className="text-right">
                  <p className="text-base font-bold text-primary">14 dias grátis</p>
                  <p className="text-xs text-muted-foreground">depois {plano.preco}</p>
                </div>
              )}
            </div>
            <ul className="space-y-2">
              {plano.features.map((f) => (
                <li key={f} className="text-sm text-muted-foreground flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" /> {f}
                </li>
              ))}
            </ul>
            {profile?.plano !== plano.id && (plano.id === 'pro' || plano.id === 'empresa') && (
              <button
                onClick={() => handleUpgrade(plano.id as 'pro' | 'empresa')}
                disabled={upgrading !== null}
                className="w-full mt-5 py-3 rounded-xl bg-primary text-white font-semibold shadow-lg shadow-orange-500/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {upgrading === plano.id
                  ? 'A abrir pagamento...'
                  : semPlanoAtivo
                    ? 'Iniciar teste grátis'
                    : 'Fazer upgrade'}
              </button>
            )}
            {profile?.plano === plano.id && (
              <p className="text-sm text-primary font-medium mt-4 text-center">✓ Plano atual</p>
            )}
          </div>
        ))}
      </div>
      {upgradeError && <p className="text-xs text-red-600 text-center mt-3">{upgradeError}</p>}
    </div>
  )
}
