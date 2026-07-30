'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User, Crown, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PROFISSOES } from '@/lib/constants'
import type { Profile } from '@/types/database'

export default function AjustesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Edit fields
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [profissao, setProfissao] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [nif, setNif] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)
  const [checkoutResult, setCheckoutResult] = useState<'sucesso' | 'cancelado' | null>(null)

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
        .single()

      if (data) {
        setProfile(data)
        setNome(data.nome || '')
        setTelefone(data.telefone || '')
        setProfissao(data.profissao || '')
        setEmpresa(data.empresa || '')
        setNif(data.nif || '')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Padrão de "fetch on mount": o setState só acontece depois do primeiro
    // await dentro de fetchProfile, não sincronamente no efeito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile()

    const checkout = new URLSearchParams(window.location.search).get('checkout')
    if (checkout === 'sucesso' || checkout === 'cancelado') {
      setCheckoutResult(checkout)
      router.replace('/ajustes')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ nome, telefone, profissao, empresa, nif })
      .eq('id', profile.id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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

      // Navegação imperativa dentro de um handler de clique (não durante o
      // render) — redireciona para o Stripe Checkout.
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = data.url
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : 'Erro ao iniciar o pagamento.')
      setUpgrading(null)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
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
      id: 'gratuito',
      nome: 'Gratuito',
      preco: '0€',
      features: ['10 cálculos/mês', '5 clientes', 'Calculadoras básicas'],
    },
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

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto w-full">
      {checkoutResult === 'sucesso' && (
        <div className="mb-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-sm font-medium px-4 py-3 text-center animate-slide-up">
          Pagamento confirmado! O seu plano será atualizado em instantes.
        </div>
      )}
      {checkoutResult === 'cancelado' && (
        <div className="mb-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-3 text-center animate-slide-up">
          Pagamento cancelado. Pode tentar novamente quando quiser.
        </div>
      )}

      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6 animate-slide-up">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-orange-500/20">
          {nome.charAt(0).toUpperCase() || <User className="w-7 h-7" />}
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{nome}</h1>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium uppercase">
            {profile?.plano || 'gratuito'}
          </span>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="glass rounded-2xl p-4 mb-4 space-y-3 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <h3 className="text-sm font-semibold text-foreground">Dados pessoais</h3>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Nome</label>
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border-color text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Telemóvel</label>
          <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="+351 912 345 678" className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border-color text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Profissão</label>
          <select value={profissao} onChange={(e) => setProfissao(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border-color text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
            <option value="">Selecione...</option>
            {PROFISSOES.map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Empresa</label>
          <input type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Nome da empresa" className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border-color text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">NIF</label>
          <input type="text" value={nif} onChange={(e) => setNif(e.target.value)} placeholder="123456789" className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border-color text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            saved
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 active:scale-[0.98]'
          }`}
        >
          {saved ? <><Check className="w-5 h-5" /> Guardado!</> : saving ? 'A guardar...' : 'Guardar alterações'}
        </button>
        {error && <p className="text-xs text-red-600 text-center">{error}</p>}
      </div>

      {/* Plans */}
      <div className="mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Crown className="w-4 h-4 text-primary" /> Planos
        </h3>
        <div className="space-y-3">
          {planos.map((plano) => (
            <div
              key={plano.id}
              className={`rounded-xl p-4 border ${
                profile?.plano === plano.id
                  ? 'border-primary bg-primary/5'
                  : plano.destaque
                    ? 'border-primary/30 glass'
                    : 'border-border-color glass'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground">{plano.nome}</h4>
                  {plano.destaque && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary text-white font-bold">POPULAR</span>
                  )}
                </div>
                <p className="text-sm font-bold text-primary">{plano.preco}</p>
              </div>
              <ul className="space-y-1">
                {plano.features.map((f) => (
                  <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              {profile?.plano !== plano.id && (plano.id === 'pro' || plano.id === 'empresa') && (
                <button
                  onClick={() => handleUpgrade(plano.id as 'pro' | 'empresa')}
                  disabled={upgrading !== null}
                  className="w-full mt-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {upgrading === plano.id ? 'A abrir pagamento...' : 'Fazer upgrade'}
                </button>
              )}
              {profile?.plano === plano.id && (
                <p className="text-xs text-primary font-medium mt-2 text-center">✓ Plano atual</p>
              )}
            </div>
          ))}
        </div>
        {upgradeError && <p className="text-xs text-red-600 text-center mt-2">{upgradeError}</p>}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium flex items-center justify-center gap-2 hover:bg-red-500/20 active:scale-[0.98] transition-all animate-slide-up"
        style={{ animationDelay: '0.15s' }}
      >
        <LogOut className="w-5 h-5" />
        Terminar sessão
      </button>
    </div>
  )
}
