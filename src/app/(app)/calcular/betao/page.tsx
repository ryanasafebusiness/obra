'use client'

import { useState } from 'react'
import { calcularBetao, type BetaoResult } from '@/lib/calculations/betao'
import { saveCalculation } from '@/lib/calculations/save'
import { createClient } from '@/lib/supabase/client'
import { formatNumber } from '@/lib/utils'
import { CalculatorLayout, FormInput, ResultRow } from '@/components/CalculatorLayout'

export default function BetaoPage() {
  const supabase = createClient()
  const [nome, setNome] = useState('')
  const [comprimento, setComprimento] = useState('')
  const [largura, setLargura] = useState('')
  const [altura, setAltura] = useState('')
  const [tipoBetao, setTipoBetao] = useState('standard')
  const [resultado, setResultado] = useState<BetaoResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCalcular = (e: React.FormEvent) => {
    e.preventDefault()
    const result = calcularBetao({
      nome: nome || 'Laje de Betão',
      comprimento: parseFloat(comprimento),
      largura: parseFloat(largura),
      altura: parseFloat(altura),
      tipo_betao: tipoBetao,
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
      tipo: 'betao',
      nome: nome || 'Laje de Betão',
      dados: {
        comprimento: parseFloat(comprimento),
        largura: parseFloat(largura),
        altura: parseFloat(altura),
        tipo_betao: tipoBetao,
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
    <CalculatorLayout
      title="Calculadora de Betão"
      onCalculate={handleCalcular}
      onSave={handleSalvar}
      saving={saving}
      saved={saved}
      error={error}
      resultado={resultado}
      renderResultHeader={() => (
        <>
          <ResultRow label="Volume total:" value={`${formatNumber(resultado!.volume_m3, 2)}m³`} />
          <ResultRow label="Cimento necessário:" value={`🏗️ ${resultado!.materiais.find(m => m.nome === 'Cimento')?.quantidade || 0} sacos`} highlight />
        </>
      )}
    >
      <FormInput label="Nome da obra" value={nome} onChange={setNome} placeholder="Ex: Laje do anexo" />
      
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Comprimento" type="number" step="0.1" required value={comprimento} onChange={setComprimento} placeholder="5.0" unit="m" />
        <FormInput label="Largura" type="number" step="0.1" required value={largura} onChange={setLargura} placeholder="4.0" unit="m" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Altura (Espessura)" type="number" step="0.01" required value={altura} onChange={setAltura} placeholder="0.15" unit="m" />
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Traço (Mistura)</label>
          <select
            value={tipoBetao}
            onChange={(e) => setTipoBetao(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none transition-all"
          >
            <option value="standard">Standard (1:2:3)</option>
          </select>
        </div>
      </div>
    </CalculatorLayout>
  )
}
