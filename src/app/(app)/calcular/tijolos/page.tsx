'use client'

import { useState } from 'react'
import { calcularTijolos, type TijolosResult } from '@/lib/calculations/tijolos'
import { saveCalculation } from '@/lib/calculations/save'
import { createClient } from '@/lib/supabase/client'
import { formatNumber } from '@/lib/utils'
import { CalculatorLayout, FormInput, ResultRow } from '@/components/CalculatorLayout'

const BLOCK_TYPES = [
  { id: 'tijolo_11', nome: 'Tijolo 11', comprimento: 30, altura: 20, espessura: 11, per_m2: 17 },
  { id: 'tijolo_15', nome: 'Tijolo 15', comprimento: 30, altura: 20, espessura: 15, per_m2: 17 },
  { id: 'bloco_20', nome: 'Bloco Térmico 20', comprimento: 50, altura: 20, espessura: 20, per_m2: 10 },
  { id: 'bloco_25', nome: 'Bloco Térmico 25', comprimento: 50, altura: 20, espessura: 25, per_m2: 10 },
]

export default function TijolosPage() {
  const supabase = createClient()
  const [nome, setNome] = useState('')
  const [comprimento, setComprimento] = useState('')
  const [altura, setAltura] = useState('')
  const [tipoBloco, setTipoBloco] = useState<string>(BLOCK_TYPES[0].id)
  const [margem, setMargem] = useState('10')
  const [resultado, setResultado] = useState<TijolosResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCalcular = (e: React.FormEvent) => {
    e.preventDefault()
    const bloco = BLOCK_TYPES.find(b => b.id === tipoBloco) || BLOCK_TYPES[0]

    const result = calcularTijolos({
      nome: nome || 'Parede de Tijolo',
      comprimento_parede: parseFloat(comprimento),
      altura_parede: parseFloat(altura),
      tipo_bloco: tipoBloco,
      blocos_por_m2: bloco.per_m2,
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
      tipo: 'tijolos',
      nome: nome || 'Parede de Tijolo',
      dados: {
        comprimento_parede: parseFloat(comprimento),
        altura_parede: parseFloat(altura),
        tipo_bloco: tipoBloco,
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
      title="Calculadora de Tijolos"
      onCalculate={handleCalcular}
      onSave={handleSalvar}
      saving={saving}
      saved={saved}
      error={error}
      resultado={resultado}
      renderResultHeader={() => (
        <>
          <ResultRow label="Área da parede:" value={`${formatNumber(resultado!.area_parede, 1)}m²`} />
          <ResultRow label="Tijolos/Blocos necessários:" value={`🧱 ${resultado!.quantidade_blocos} un`} highlight />
        </>
      )}
    >
      <FormInput label="Nome da obra" value={nome} onChange={setNome} placeholder="Ex: Muro exterior" />
      
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Comprimento" type="number" step="0.1" required value={comprimento} onChange={setComprimento} placeholder="5.0" unit="m" />
        <FormInput label="Altura" type="number" step="0.1" required value={altura} onChange={setAltura} placeholder="2.5" unit="m" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipo de Bloco / Tijolo</label>
          <select
            value={tipoBloco}
            onChange={(e) => setTipoBloco(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none transition-all"
          >
            {BLOCK_TYPES.map(bloco => (
              <option key={bloco.id} value={bloco.id}>
                {bloco.nome}
              </option>
            ))}
          </select>
        </div>
        <FormInput label="Margem de desperdício" type="number" step="1" required value={margem} onChange={setMargem} placeholder="10" unit="%" />
      </div>
    </CalculatorLayout>
  )
}
