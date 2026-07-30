'use client'

import { useState, useEffect } from 'react'
import { Plus, Send, Download, Phone, ReceiptText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Budget, BudgetItem, Client } from '@/types/database'
import { BUDGET_STATUS } from '@/lib/constants'

// gerado fora do componente para não ser uma chamada "impura" durante o render
function gerarNumeroOrcamento() {
  return `ORC-${Date.now().toString(36).toUpperCase()}`
}

export default function OrcamentosPage() {
  const supabase = createClient()
  const [orcamentos, setOrcamentos] = useState<(Budget & { client?: Client })[]>([])
  const [clientes, setClientes] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null)

  // Form fields
  const [clienteId, setClienteId] = useState('')
  const [itens, setItens] = useState([{ descricao: '', quantidade: 1, unidade: 'un', preco_unitario: 0 }])
  const [maoDeObra, setMaoDeObra] = useState('')
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const [{ data: budgets }, { data: clients }] = await Promise.all([
        supabase.from('budgets').select('*, client:clients(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('clients').select('*').eq('user_id', user.id),
      ])

      setOrcamentos(budgets || [])
      setClientes(clients || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Padrão de "fetch on mount": o setState só acontece depois do primeiro
    // await dentro de fetchData, não sincronamente no efeito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addItem = () => setItens([...itens, { descricao: '', quantidade: 1, unidade: 'un', preco_unitario: 0 }])
  const removeItem = (i: number) => setItens(itens.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, value: string | number) => {
    const updated = [...itens]
    updated[i] = { ...updated[i], [field]: value }
    setItens(updated)
  }

  const subtotalMateriais = itens.reduce((acc, item) => acc + item.quantidade * item.preco_unitario, 0)
  const maoDeObraVal = parseFloat(maoDeObra) || 0
  const subtotal = subtotalMateriais + maoDeObraVal
  const iva = subtotal * 0.23
  const total = subtotal + iva

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

    if (editingBudgetId) {
      const { error: updateError } = await supabase.from('budgets').update({
        client_id: clienteId || null,
        itens: itens.map(item => ({ ...item, total: item.quantidade * item.preco_unitario })),
        mao_de_obra: maoDeObraVal,
        materiais_total: subtotalMateriais,
        iva: 23,
        total,
        notas: notas || null,
      }).eq('id', editingBudgetId)
      
      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
    } else {
      const { error: insertError } = await supabase.from('budgets').insert({
        user_id: user.id,
        client_id: clienteId || null,
        numero: gerarNumeroOrcamento(),
        itens: itens.map(item => ({ ...item, total: item.quantidade * item.preco_unitario })),
        mao_de_obra: maoDeObraVal,
        materiais_total: subtotalMateriais,
        iva: 23,
        total,
        notas: notas || null,
        status: 'rascunho',
      })
      
      if (insertError) {
        setError(insertError.message)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setShowForm(false)
    setEditingBudgetId(null)
    setItens([{ descricao: '', quantidade: 1, unidade: 'un', preco_unitario: 0 }])
    setMaoDeObra('')
    setNotas('')
    setClienteId('')
    fetchData()
  }

  const handleEdit = (orc: Budget & { client?: Client }) => {
    setEditingBudgetId(orc.id)
    setClienteId(orc.client_id || '')
    setItens(orc.itens as any || [])
    setMaoDeObra(orc.mao_de_obra.toString())
    setNotas(orc.notas || '')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const enviarWhatsApp = (orc: Budget & { client?: Client }) => {
    const cliente = orc.client?.nome || 'Cliente'
    const tel = orc.client?.telefone || ''
    const msg = encodeURIComponent(
      `📄 ORÇAMENTO ${orc.numero}\n\nCliente: ${cliente}\n\nMateriais: ${formatCurrency(orc.materiais_total)}\nMão de obra: ${formatCurrency(orc.mao_de_obra)}\nIVA (23%): ${formatCurrency(orc.total - orc.materiais_total - orc.mao_de_obra)}\n\n💰 TOTAL: ${formatCurrency(orc.total)}\n\n${orc.notas || ''}`
    )
    const url = tel ? `https://wa.me/${tel.replace(/\D/g, '')}?text=${msg}` : `https://wa.me/?text=${msg}`
    window.open(url, '_blank')
  }

  const gerarPDF = async (orc: Budget & { client?: Client }) => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const cliente = orc.client?.nome || 'Cliente'

    // Header
    doc.setFontSize(22)
    doc.setTextColor(249, 115, 22)
    doc.text('ORÇAMENTO DE OBRA', 20, 25)

    doc.setFontSize(10)
    doc.setTextColor(120, 113, 108)
    doc.text(`Nº: ${orc.numero}`, 20, 35)
    doc.text(`Data: ${formatDate(orc.created_at)}`, 20, 42)

    // Client info
    doc.setFontSize(12)
    doc.setTextColor(28, 25, 23)
    doc.text(`Cliente: ${cliente}`, 20, 55)
    if (orc.client?.telefone) doc.text(`Tel: ${orc.client.telefone}`, 20, 62)

    // Items
    let y = 78
    doc.setFontSize(11)
    doc.setTextColor(249, 115, 22)
    doc.text('ITENS', 20, y)
    y += 8

    doc.setFontSize(10)
    doc.setTextColor(28, 25, 23)
    const orcItens = orc.itens as { descricao: string; quantidade: number; unidade: string; preco_unitario: number; total: number }[]
    orcItens.forEach((item) => {
      doc.text(`${item.descricao}`, 20, y)
      doc.text(`${item.quantidade} ${item.unidade} x ${formatCurrency(item.preco_unitario)}`, 100, y)
      doc.text(formatCurrency(item.total), 170, y)
      y += 7
    })

    // Totals
    y += 10
    doc.setDrawColor(229, 231, 235)
    doc.line(20, y, 190, y)
    y += 8

    doc.text(`Materiais: ${formatCurrency(orc.materiais_total)}`, 20, y)
    y += 7
    doc.text(`Mão de obra: ${formatCurrency(orc.mao_de_obra)}`, 20, y)
    y += 7
    doc.text(`IVA (23%): ${formatCurrency(orc.total - orc.materiais_total - orc.mao_de_obra)}`, 20, y)
    y += 10

    doc.setFontSize(14)
    doc.setTextColor(249, 115, 22)
    doc.text(`TOTAL: ${formatCurrency(orc.total)}`, 20, y)

    doc.save(`orcamento-${orc.numero}.pdf`)
  }

  return (
    <div className="px-5 pt-8 pb-8 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between mb-8 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Orçamentos</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">{orcamentos.length} documentos criados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="w-12 h-12 flex items-center justify-center rounded-2xl btn-primary-gradient shadow-lg shadow-orange-500/30 text-white">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Create Budget Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="floating-card p-5 mb-8 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-800">{editingBudgetId ? 'Editar Orçamento' : 'Novo Orçamento'}</h3>
            <div className="p-2 bg-slate-50 rounded-lg"><ReceiptText className="w-5 h-5 text-slate-400" /></div>
          </div>

          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none font-medium">
            <option value="">Selecionar cliente (opcional)</option>
            {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>

          {/* Items */}
          <div className="space-y-3 pt-2">
            <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">Itens do orçamento</p>
            {itens.map((item, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative">
                <button type="button" onClick={() => removeItem(i)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold shadow-sm">×</button>
                <input required placeholder="Descrição (ex: Placa Pladur)" value={item.descricao} onChange={(e) => updateItem(i, 'descricao', e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 mb-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium" />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Qtd</label>
                    <input type="number" required min="0.01" step="0.01" value={item.quantidade} onChange={(e) => updateItem(i, 'quantidade', parseFloat(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Unid</label>
                    <input required placeholder="m², un" value={item.unidade} onChange={(e) => updateItem(i, 'unidade', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Preço (€)</label>
                    <input type="number" required step="0.01" value={item.preco_unitario} onChange={(e) => updateItem(i, 'preco_unitario', parseFloat(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium" />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addItem} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-600 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
              <Plus className="w-5 h-5" /> Adicionar item
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mão de obra (€)</label>
              <input type="number" step="0.01" value={maoDeObra} onChange={(e) => setMaoDeObra(e.target.value)} placeholder="Ex: 500.00" className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">IVA (%)</label>
              <input type="number" value="23" disabled className="w-full px-4 py-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 font-medium cursor-not-allowed" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notas / Condições</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ex: Validade de 30 dias..." rows={3} className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" />
          </div>

          {/* Totals preview */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 space-y-2 mt-4 text-white shadow-lg">
            <div className="flex justify-between text-sm text-slate-300">
              <span>Materiais</span><span>{formatCurrency(subtotalMateriais)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-300">
              <span>Mão de obra</span><span>{formatCurrency(maoDeObraVal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-300 pb-2 border-b border-slate-700">
              <span>IVA (23%)</span><span>{formatCurrency(iva)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-1 text-white">
              <span>TOTAL</span><span>{formatCurrency(total)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowForm(false); setEditingBudgetId(null); }} className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold active:scale-[0.98] transition-transform">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-[2] py-3.5 rounded-2xl btn-primary-gradient font-bold active:scale-[0.98] transition-transform disabled:opacity-50 text-white">
              {saving ? 'A guardar...' : (editingBudgetId ? 'Atualizar Orçamento' : 'Guardar Orçamento')}
            </button>
          </div>
        </form>
      )}

      {/* Budget List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orcamentos.length > 0 ? (
        <div className="space-y-6">
          {orcamentos.map((orc, i) => {
            const status = BUDGET_STATUS[orc.status as keyof typeof BUDGET_STATUS] || BUDGET_STATUS.rascunho
            
            return (
              <div key={orc.id} className="floating-card overflow-hidden animate-slide-up" style={{ animationDelay: `${0.1 * (i + 1)}s` }}>
                {/* Header (Orange) */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white flex justify-between items-start">
                  <div>
                    <p className="text-orange-100 font-medium text-xs tracking-wider uppercase mb-1">Orçamento Oficial</p>
                    <h3 className="font-bold text-lg">{orc.numero}</h3>
                  </div>
                  <div className="text-right">
                    <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                      {formatDate(orc.created_at)}
                    </div>
                    <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Cliente</p>
                      <p className="font-bold text-slate-800">{orc.client?.nome || 'Cliente não associado'}</p>
                    </div>
                  </div>

                  {/* Receipt items snippet */}
                  <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-100 text-[10px] font-bold text-slate-500 px-3 py-1 rounded-full uppercase tracking-wider">Resumo</div>
                    <ul className="space-y-1.5 mt-2">
                      {(orc.itens as BudgetItem[]).slice(0, 3).map((item, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2 text-slate-600">
                          <span className="text-primary mt-0.5">•</span>
                          <span className="truncate">{item.descricao}</span>
                        </li>
                      ))}
                      {(orc.itens as BudgetItem[]).length > 3 && (
                        <li className="text-sm text-slate-400 italic ml-4">+ {(orc.itens as BudgetItem[]).length - 3} itens</li>
                      )}
                    </ul>
                  </div>

                  {/* Total line (dashed border) */}
                  <div className="border-t-2 border-dashed border-slate-200 pt-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total</span>
                    <span className="text-2xl font-black text-slate-800">{formatCurrency(orc.total)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 pt-0 grid grid-cols-2 gap-3">
                  <button onClick={() => enviarWhatsApp(orc)} className="col-span-2 py-3.5 rounded-xl bg-[#25D366] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-colors shadow-lg shadow-[#25D366]/20">
                    <Send className="w-4 h-4" /> Enviar WhatsApp
                  </button>
                  <button onClick={() => handleEdit(orc)} className="py-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-50 transition-colors">
                    Editar
                  </button>
                  <button onClick={() => gerarPDF(orc)} className="py-3.5 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                    <Download className="w-4 h-4" /> PDF
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="floating-card p-10 text-center animate-slide-up">
          <div className="w-16 h-16 bg-orange-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <ReceiptText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Sem orçamentos</h3>
          <p className="text-sm text-slate-500 mb-6">Crie orçamentos detalhados para os seus clientes de forma rápida.</p>
          <button onClick={() => setShowForm(true)} className="px-6 py-3 rounded-full btn-primary-gradient font-bold shadow-md">
            Criar Orçamento
          </button>
        </div>
      )}
    </div>
  )
}
