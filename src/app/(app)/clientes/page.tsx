'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Phone, Mail, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/types/database'

export default function ClientesPage() {
  const supabase = createClient()
  const [clientes, setClientes] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [morada, setMorada] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClientes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setClientes(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Padrão de "fetch on mount": o setState só acontece depois do primeiro
    // await dentro de fetchClientes, não sincronamente no efeito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClientes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Sessão expirada. Inicie sessão novamente.')
      setSaving(false)
      return
    }

    const { error: insertError } = await supabase.from('clients').insert({
      user_id: user.id,
      nome,
      telefone: telefone || null,
      email: email || null,
      morada: morada || null,
    })

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setNome('')
    setTelefone('')
    setEmail('')
    setMorada('')
    setShowForm(false)
    fetchClientes()
  }

  const filtered = clientes.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">👥 Clientes</h1>
          <p className="text-sm text-muted-foreground">{clientes.length} clientes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar clientes..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-elevated border border-border-color text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Add Client Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-4 mb-4 space-y-3 animate-slide-up">
          <h3 className="text-sm font-semibold text-foreground">Novo Cliente</h3>
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome *" required className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border-color text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telemóvel" className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border-color text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border-color text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input type="text" value={morada} onChange={(e) => setMorada(e.target.value)} placeholder="Morada" className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border-color text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-surface-elevated border border-border-color text-foreground font-medium active:scale-[0.98] transition-transform">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold active:scale-[0.98] transition-transform disabled:opacity-50">
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {/* Client List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((client) => (
            <div key={client.id} className="glass rounded-xl p-4 card-hover">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {client.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{client.nome}</p>
                  {client.telefone && (
                    <a href={`tel:${client.telefone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 hover:text-primary">
                      <Phone className="w-3 h-3" /> {client.telefone}
                    </a>
                  )}
                  {client.email && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Mail className="w-3 h-3" /> {client.email}
                    </p>
                  )}
                  {client.morada && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3" /> {client.morada}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-xl p-8 text-center">
          <span className="text-4xl mb-3 block">👥</span>
          <p className="text-sm text-muted-foreground">
            {search ? 'Nenhum cliente encontrado.' : 'Ainda não tem clientes.'}
          </p>
          {!search && (
            <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-primary font-medium hover:underline">
              Adicionar primeiro cliente →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
