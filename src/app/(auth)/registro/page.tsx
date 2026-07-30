'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PROFISSOES } from '@/lib/constants'

export default function RegistroPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [telefone, setTelefone] = useState('')
  const [profissao, setProfissao] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          telefone,
          profissao,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Create profile
      await supabase.from('profiles').upsert({
        id: data.user.id,
        nome,
        email,
        telefone,
        profissao,
        plano: 'gratuito',
      })

      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Criar Conta</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comece a calcular obras agora
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
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
              className="w-full px-4 py-3.5 rounded-xl bg-surface-elevated border border-border-color text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

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
              className="w-full px-4 py-3.5 rounded-xl bg-surface-elevated border border-border-color text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-muted-foreground mb-1">
              Telemóvel
            </label>
            <input
              id="telefone"
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="+351 912 345 678"
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
            ) : (
              'Criar Conta'
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
