'use client'

import { useState } from 'react'
import { calcularPiso, type PisoResult } from '@/lib/calculations/piso'
import { saveCalculation } from '@/lib/calculations/save'
import { createClient } from '@/lib/supabase/client'
import { formatNumber } from '@/lib/utils'
import { CalculatorLayout, FormInput, ResultRow } from '@/components/CalculatorLayout'

export default function PisoPage() {
  const supabase = createClient()
  const [nome, setNome] = useState('')
  const [comprimento, setComprimento] = useState('')
  const [largura, setLargura] = useState('')
  const [tipoPiso, setTipoPiso] = useState('flutuante')
  const [m2PorCaixa, setM2PorCaixa] = useState('2.4')
  const [margem, setMargem] = useState('10')
  const [resultado, setResultado] = useState<PisoResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCalcular = (e: React.FormEvent) => {
    e.preventDefault()
    const result = calcularPiso({
      nome: nome || 'Colocação de Piso',
      comprimento: parseFloat(comprimento),
      largura: parseFloat(largura),
      tipo_piso: tipoPiso,
      m2_por_caixa: parseFloat(m2PorCaixa),
      margem_desperdicio: parseFloat(margem)
    })
    setResultado(result)
    setSaved(false)
    setError(null)
  }

  const handleSalvar = async (editedResult: any, projeto: { projetoId: string; novaObraNome: string }) => {
    if (!editedResult) return
    setSaving(true)
    setError(null)

    const { error: saveError } = await saveCalculation(supabase, {
      tipo: 'piso',
      nome: nome || 'Colocação de Piso',
      dados: {
        comprimento: parseFloat(comprimento),
        largura: parseFloat(largura),
        tipo_piso: tipoPiso,
        m2_por_caixa: parseFloat(m2PorCaixa),
        margem_desperdicio: parseFloat(margem)
      },
      resultado: editedResult,
      projetoId: projeto.projetoId,
      novaObraNome: projeto.novaObraNome,
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
      title="Calculadora de Piso"
      onCalculate={handleCalcular}
      onSave={handleSalvar}
      saving={saving}
      saved={saved}
      error={error}
      resultado={resultado}
      renderResultHeader={() => (
        <>
          <ResultRow label="Área + margem:" value={`${formatNumber(resultado!.area_com_margem, 1)}m²`} />
          <ResultRow label="Caixas necessárias:" value={`📦 ${resultado!.caixas_necessarias} un`} highlight />
        </>
      )}
    >
      <FormInput label="Nome da obra" value={nome} onChange={setNome} placeholder="Ex: Chão da sala" />
      
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Comprimento" type="number" step="0.1" required value={comprimento} onChange={setComprimento} placeholder="5.0" unit="m" />
        <FormInput label="Largura" type="number" step="0.1" required value={largura} onChange={setLargura} placeholder="4.0" unit="m" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipo de Piso</label>
          <select
            value={tipoPiso}
            onChange={(e) => setTipoPiso(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none transition-all"
          >
            <option value="flutuante">Piso Flutuante</option>
            <option value="vinilico">Piso Vinílico</option>
            <option value="ceramico">Cerâmico</option>
          </select>
        </div>
        <FormInput label="m² por Caixa" type="number" step="0.1" required value={m2PorCaixa} onChange={setM2PorCaixa} placeholder="2.4" unit="m²" />
      </div>

      <FormInput label="Margem de desperdício" type="number" step="1" required value={margem} onChange={setMargem} placeholder="10" unit="%" />
    </CalculatorLayout>
  )
}
