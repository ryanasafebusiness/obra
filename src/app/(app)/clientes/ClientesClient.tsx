'use client'

import { useState } from 'react'
import { Plus, Search, Phone, Mail, MapPin, Trash2, Edit2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/types/database'

export default function ClientesClient({ initialClients }: { initialClients: Client[] }) {
  const supabase = createClient()
  const [clientes, setClientes] = useState<Client[]>(initialClients)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form fields
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [morada, setMorada] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClientes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        
      setClientes(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleEdit = (client: Client) => {
    setEditingId(client.id)
    setNome(client.nome)
    setTelefone(client.telefone || '')
    setEmail(client.email || '')
    setMorada(client.morada || '')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem a certeza que deseja apagar este cliente? Esta ação não pode ser desfeita.')) return
    
    try {
      const { error: deleteError } = await supabase.from('clients').delete().eq('id', id)
      if (deleteError) throw deleteError
      
      setClientes(clientes.filter(c => c.id !== id))
    } catch (err: any) {
      alert(err.message || 'Erro ao apagar cliente')
    }
  }

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

    if (editingId) {
      const { error: updateError } = await supabase.from('clients').update({
        nome,
        telefone: telefone || null,
        email: email || null,
        morada: morada || null,
      }).eq('id', editingId)
  
      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
    } else {
      const { error: insertError } = await supabase.from('clients').insert({
        user_id: user.id,
        nome,
        telefone: telefone || null,
        email: email || null,
        morada: morada || null,
      })
  
      if (insertError) {
        setError(insertError.message)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setNome('')
    setTelefone('')
    setEmail('')
    setMorada('')
    setEditingId(null)
    setShowForm(false)
    fetchClientes()
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setNome('')
    setTelefone('')
    setEmail('')
    setMorada('')
    setError(null)
  }

  const filtered = clientes.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="px-5 pt-8 pb-8 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between mb-8 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Clientes</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">{clientes.length} contactos</p>
        </div>
        <button
          onClick={() => {
            if (showForm && !editingId) {
              handleCancel()
            } else {
              handleCancel()
              setShowForm(true)
            }
          }}
          className="w-12 h-12 flex items-center justify-center rounded-2xl btn-primary-gradient shadow-lg shadow-orange-500/30 text-white"
        >
          <Plus className={`w-6 h-6 transition-transform ${showForm && !editingId ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar clientes..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm font-medium"
        />
      </div>

      {/* Add/Edit Client Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="floating-card p-5 mb-8 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h3>
          </div>
          
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo *" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
          <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telemóvel" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
          <input type="text" value={morada} onChange={(e) => setMorada(e.target.value)} placeholder="Morada completa" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
          
          {error && <p className="text-xs text-red-500 font-medium bg-red-50 p-3 rounded-lg">{error}</p>}
          
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleCancel} className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-3.5 rounded-xl btn-primary-gradient text-white font-bold shadow-lg shadow-orange-500/30 disabled:opacity-50 transition-transform active:scale-[0.98]">
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {/* Client List */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((client, i) => (
            <div key={client.id} className="floating-card p-5 animate-slide-up hover:border-primary/30 transition-colors group" style={{ animationDelay: `${0.1 * (i + 1)}s` }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-black text-lg flex-shrink-0">
                  {client.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-800 text-base">{client.nome}</h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100">
                      <button onClick={() => handleEdit(client)} className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-orange-50">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(client.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 space-y-1.5">
                    {client.telefone && (
                      <a href={`tel:${client.telefone}`} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {client.telefone}
                      </a>
                    )}
                    {client.email && (
                      <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {client.email}
                      </a>
                    )}
                    {client.morada && (
                      <p className="flex items-start gap-2 text-sm text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" /> {client.morada}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-10 bg-slate-50 border border-slate-100 rounded-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhum cliente</h3>
          <p className="text-sm text-slate-500 mb-6">
            {search ? 'Não encontrámos nenhum cliente com essa pesquisa.' : 'Comece a adicionar a sua carteira de clientes.'}
          </p>
          {!search && (
            <button onClick={() => setShowForm(true)} className="inline-block px-6 py-3 rounded-full btn-primary-gradient font-bold shadow-md text-white">
              Novo Cliente
            </button>
          )}
        </div>
      )}
    </div>
  )
}
