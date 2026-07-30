'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, Check, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import { PROFISSOES } from '@/lib/constants'
import Link from 'next/link'

export default function DadosProfissionaisPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const [profissao, setProfissao] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [nif, setNif] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
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
        .single()

      if (data) {
        setProfile(data)
        setProfissao(data.profissao || '')
        setEmpresa(data.empresa || '')
        setNif(data.nif || '')
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profissao, empresa, nif })
      .eq('id', profile.id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto w-full animate-slide-right">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ajustes" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Dados profissionais</h1>
      </div>

      <div className="glass rounded-2xl p-4 mb-4">
        <div className="space-y-4">
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
            className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all mt-4 ${
              saved
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 active:scale-[0.98]'
            }`}
          >
            {saved ? <><Check className="w-5 h-5" /> Guardado!</> : saving ? 'A guardar...' : 'Guardar dados profissionais'}
          </button>
          {error && <p className="text-xs text-red-600 text-center">{error}</p>}
        </div>
      </div>
    </div>
  )
}
