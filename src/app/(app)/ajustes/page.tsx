'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Briefcase, Crown, LogOut, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AjustesMenuPage() {
  const supabase = createClient()
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [plano, setPlano] = useState('gratuito')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHeaderInfo()
  }, [])

  const fetchHeaderInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      setEmail(user.email || '')

      const { data } = await supabase
        .from('profiles')
        .select('nome, plano')
        .eq('id', user.id)
        .single()

      if (data) {
        setNome(data.nome || '')
        setPlano(data.plano || 'gratuito')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const MENU_ITEMS = [
    {
      title: 'Dados pessoais',
      icon: User,
      href: '/ajustes/dados-pessoais',
      description: 'Nome, telemóvel'
    },
    {
      title: 'Dados profissionais',
      icon: Briefcase,
      href: '/ajustes/dados-profissionais',
      description: 'Profissão, NIF, Empresa'
    },
    {
      title: 'Plano e faturação',
      icon: Crown,
      href: '/ajustes/planos',
      description: 'Gerir a sua subscrição'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 pt-8 pb-4 max-w-lg mx-auto w-full animate-slide-up">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Ajustes</h1>

      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-orange-500/20">
          {nome.charAt(0).toUpperCase() || <User className="w-7 h-7" />}
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{nome}</h2>
          <p className="text-sm text-muted-foreground">{email}</p>
          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium uppercase tracking-wider">
            {plano === 'pro' || plano === 'empresa' ? plano : 'sem plano'}
          </span>
        </div>
      </div>

      {/* Settings Menu */}
      <div className="glass rounded-3xl overflow-hidden mb-6 divide-y divide-border-color">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between p-4 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-4 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 font-semibold flex items-center justify-center gap-2 hover:bg-red-500/20 active:scale-[0.98] transition-all"
      >
        <LogOut className="w-5 h-5" />
        Terminar sessão
      </button>
    </div>
  )
}
