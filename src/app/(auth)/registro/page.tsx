'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PROFISSOES } from '@/lib/constants'

type Plano = 'pro'

const PLANOS: {
  id: Plano
  nome: string
  preco: string
  destaque?: boolean
  features: string[]
}[] = [
  {
    id: 'pro',
    nome: 'Pro',
    preco: '4,99€/mês',
    destaque: true,
    features: ['Cálculos ilimitados', 'Clientes ilimitados', 'PDFs', 'Histórico completo', 'Banco de materiais'],
  },
]

const STEPS = [
  {
    title: 'Vamos começar 👷',
    subtitle: 'Leva menos de 2 minutos.',
  },
  {
    title: 'Cria a tua conta',
    subtitle: 'Os teus orçamentos ficam guardados e prontos a enviar a qualquer hora.',
  },
  {
    title: 'O teu plano',
    subtitle: '14 dias grátis. Cancele quando quiser, sem custos.',
  },
] as const

export default function RegistroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [nome, setNome] = useState('')
  const [profissao, setProfissao] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [plano, setPlano] = useState<Plano>('pro')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  const isLastStep = step === STEPS.length - 1

  const goNext = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const goBack = () => {
    setError('')
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome, profissao, plano_pretendido: plano },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Não foi possível criar a conta. Tente novamente.')
      setLoading(false)
      return
    }

    // Sem confirmação de email ainda não há sessão — o perfil (nome,
    // profissão) já ficou gravado pelo trigger handle_new_user() a partir
    // dos metadados do signUp. O checkout do trial arranca automaticamente
    // em /auth/callback assim que o email for confirmado.
    if (!data.session) {
      setAwaitingConfirmation(true)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano }),
      })
      const checkoutData = await res.json()

      if (!res.ok) {
        throw new Error(checkoutData.error || 'Não foi possível iniciar o pagamento.')
      }

      window.location.href = checkoutData.url
    } catch {
      // A conta já foi criada — o trial pode ser iniciado em Ajustes.
      router.push('/dashboard')
      router.refresh()
    }
  }

  const progressPct = ((step + 1) / STEPS.length) * 100
  const planoSelecionado = PLANOS.find((p) => p.id === plano)!

  if (awaitingConfirmation) {
    return (
      <div className="animate-slide-up">
        <div className="glass rounded-2xl p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <MailCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Confirme o seu email</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Enviámos um link de confirmação para <span className="font-medium text-foreground">{email}</span>.
              Abra-o para ativar a sua conta.
            </p>
          </div>
          <p className="text-xs text-muted-foreground bg-surface-elevated rounded-xl p-3">
            Assim que confirmar, o seu teste grátis de 14 dias no plano {planoSelecionado.nome} arranca
            automaticamente — só falta indicar o cartão.
          </p>
          <Link
            href="/login"
            className="block w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-base hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-transform"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-slide-up">
      <div className="glass rounded-2xl p-6 space-y-5">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <span />
            )}
            <span className="text-xs font-medium text-muted-foreground">
              Passo {step + 1} de {STEPS.length}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">{STEPS[step].title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{STEPS[step].subtitle}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={isLastStep ? handleSubmit : goNext} className="space-y-3.5">
          {step === 0 && (
            <>
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-muted-foreground mb-1">
                  Nome completo
                </label>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="João Silva"
                  required
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-xl bg-surface-elevated border border-border-color text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="profissao" className="block text-sm font-medium text-muted-foreground mb-1">
                  Profissão
                </label>
                <select
                  id="profissao"
                  value={profissao}
                  onChange={(e) => setProfissao(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-surface-elevated border border-border-color text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none"
                >
                  <option value="">Selecione...</option>
                  {PROFISSOES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-muted-foreground mb-1">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-xl bg-surface-elevated border border-border-color text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-muted-foreground mb-1">
                  Senha
                </label>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="w-full px-4 py-3.5 rounded-xl bg-surface-elevated border border-border-color text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-center">
                <p className="text-sm font-bold text-primary">🎉 14 dias grátis</p>
                <p className="text-xs text-muted-foreground mt-0.5">Pedimos o cartão só para ativar o trial — sem cobranças agora.</p>
              </div>

              {PLANOS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlano(p.id)}
                  className={`w-full text-left rounded-xl p-4 border transition-all ${
                    plano === p.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border-color glass hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          plano === p.id ? 'border-primary bg-primary' : 'border-border-color'
                        }`}
                      >
                        {plano === p.id && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                      </span>
                      <h4 className="text-sm font-semibold text-foreground">{p.nome}</h4>
                      {p.destaque && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary text-white font-bold">MAIS POPULAR</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">14 dias grátis</p>
                      <p className="text-[11px] text-muted-foreground">depois {p.preco}</p>
                    </div>
                  </div>
                  <ul className="space-y-0.5 pl-6">
                    {p.features.map((f) => (
                      <li key={f} className="text-xs text-muted-foreground">{f}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-base hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-transform mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                A criar conta...
              </span>
            ) : isLastStep ? (
              <span className="flex items-center justify-center gap-2">
                Começar teste grátis de 14 dias
                <ArrowRight className="w-4 h-4" />
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Continuar
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Já tem conta?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Iniciar sessão
        </Link>
      </p>
    </div>
  )
}
