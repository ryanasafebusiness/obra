'use client'

import { useState } from 'react'
import { ArrowLeft, Save, Calculator, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { calcularPintura, type PinturaResult } from '@/lib/calculations/pintura'
import { saveCalculation } from '@/lib/calculations/save'
import { createClient } from '@/lib/supabase/client'
import { formatNumber, formatCurrency } from '@/lib/utils'

// Rendimento (m² por litro) não tem campo próprio no formulário — usa-se o
// valor médio para tinta de interior.
const RENDIMENTO_PADRAO = 10

export default function PinturaPage() {
  const supabase = createClient()
  const [nome, setNome] = useState('')
  const [comprimento, setComprimento] = useState('')
  const [altura, setAltura] = useState('')
  const [paredes, setParedes] = useState('4')
  const [portas, setPortas] = useState('1.6')
  const [janelas, setJanelas] = useState('1.2')
  const [demaos, setDemaos] = useState('2')
  const [resultado, setResultado] = useState<PinturaResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCalcular = (e: React.FormEvent) => {
    e.preventDefault()
    const result = calcularPintura({
      nome: nome || 'Pintura',
      comprimento: parseFloat(comprimento),
      altura: parseFloat(altura),
      quantidade_paredes: parseInt(paredes),
      area_portas: parseFloat(portas),
      area_janelas: parseFloat(janelas),
      demaos: parseInt(demaos),
      rendimento: RENDIMENTO_PADRAO,
    })
    setResultado(result)
    setSaved(false)
    setError(null)
  }

  const handleSalvar = async () => {
    if (!resultado) return
    setSaving(true)
    setError(null)

    const { error: saveError } = await saveCalculation(supabase, {
      tipo: 'pintura',
      nome: nome || 'Pintura',
      dados: {
        comprimento: parseFloat(comprimento),
        altura: parseFloat(altura),
        paredes: parseInt(paredes),
        portas: parseFloat(portas),
        janelas: parseFloat(janelas),
        demaos: parseInt(demaos),
        rendimento: RENDIMENTO_PADRAO,
      },
      resultado,
    })

    setSaving(false)
    if (saveError) {
      setError(saveError)
      return
    }
    setSaved(true)
  }

  return (
    <div className="px-5 pt-8 pb-8 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/calcular" className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Calculadora de Pintura
          </h1>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="floating-card p-6 mb-6">
        <form onSubmit={handleCalcular} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome do ambiente</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Sala de estar"
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Comprimento</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={comprimento}
                  onChange={(e) => setComprimento(e.target.value)}
                  placeholder="5.0"
                  required
                  className="w-full pl-4 pr-8 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">m</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Altura</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  placeholder="3.0"
                  required
                  className="w-full pl-4 pr-8 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">m</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Paredes</label>
              <input
                type="number"
                value={paredes}
                onChange={(e) => setParedes(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Demãos</label>
              <input
                type="number"
                value={demaos}
                onChange={(e) => setDemaos(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 hidden">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Portas (m²)</label>
              <input
                type="number"
                step="0.1"
                value={portas}
                onChange={(e) => setPortas(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Janelas (m²)</label>
              <input
                type="number"
                step="0.1"
                value={janelas}
                onChange={(e) => setJanelas(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 mt-2 rounded-2xl btn-primary-gradient text-white font-bold text-[17px] flex items-center justify-center gap-2"
          >
            <Calculator className="w-5 h-5" />
            Calcular Material
          </button>
        </form>
      </div>

      {/* Results */}
      {resultado && (
        <div className="animate-slide-up space-y-5">
          <div className="floating-card p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-100">
            <h2 className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-4">
              Resultado em destaque
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-end justify-between border-b border-orange-200/50 pb-3">
                <span className="text-slate-600 font-medium">Área total:</span>
                <span className="text-2xl font-bold text-slate-800">{formatNumber(resultado.area_total, 1)}m²</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-slate-600 font-medium">Necessário:</span>
                <span className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                  🪣 {resultado.litros_necessarios} Litros
                </span>
              </div>
            </div>
          </div>

          {/* Detailed List */}
          <div className="floating-card p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Custo Estimado</h3>
            <div className="space-y-3">
              {resultado.materiais.map((mat, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-semibold text-slate-700">{mat.nome}</p>
                    <p className="text-sm text-slate-400">{mat.quantidade} {mat.unidade}</p>
                  </div>
                  <p className="font-bold text-slate-800">{formatCurrency(mat.preco_estimado)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
              <p className="font-bold text-slate-800">Total materiais</p>
              <p className="text-2xl font-black text-primary">{formatCurrency(resultado.custo_total_materiais)}</p>
            </div>
          </div>

          <button
            onClick={handleSalvar}
            disabled={saving || saved}
            className={`w-full py-4 rounded-2xl font-bold text-[17px] flex items-center justify-center gap-2 transition-all ${
              saved
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm'
                : 'bg-white border border-slate-200 text-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 active:scale-[0.98]'
            }`}
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Adicionado ao orçamento
              </>
            ) : saving ? (
              'A processar...'
            ) : (
              <>
                <Save className="w-5 h-5" />
                Adicionar ao orçamento
              </>
            )}
          </button>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
