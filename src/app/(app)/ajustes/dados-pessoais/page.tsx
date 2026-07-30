'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Check, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import Link from 'next/link'

export default function DadosPessoaisPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
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
        .maybeSingle()

      if (data) {
        setProfile(data)
        setNome(data.nome || '')
        setTelefone(data.telefone || '')
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
      .update({ nome, telefone })
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
        <h1 className="text-xl font-bold text-foreground">Dados pessoais</h1>
      </div>

      <div className="glass rounded-2xl p-4 mb-4">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Nome</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border-color text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Telemóvel</label>
            <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="+351 912 345 678" className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border-color text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" />
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
            {saved ? <><Check className="w-5 h-5" /> Guardado!</> : saving ? 'A guardar...' : 'Guardar dados pessoais'}
          </button>
          {error && <p className="text-xs text-red-600 text-center">{error}</p>}
        </div>
      </div>
    </div>
  )
}
