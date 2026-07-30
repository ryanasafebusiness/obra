'use client'

import { useState } from 'react'
import { calcularPladur, type PladurResult } from '@/lib/calculations/pladur'
import { saveCalculation } from '@/lib/calculations/save'
import { createClient } from '@/lib/supabase/client'
import { formatNumber } from '@/lib/utils'

type TipoPlaca = 'standard' | 'hidrofuga' | 'fogo'
import { CalculatorLayout, FormInput, ResultRow } from '@/components/CalculatorLayout'

export default function PladurPage() {
  const supabase = createClient()
  const [nome, setNome] = useState('')
  const [comprimento, setComprimento] = useState('')
  const [altura, setAltura] = useState('')
  const [tipoPlaca, setTipoPlaca] = useState<TipoPlaca>('standard')
  const [duplaFace, setDuplaFace] = useState(false)
  const [resultado, setResultado] = useState<PladurResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCalcular = (e: React.FormEvent) => {
    e.preventDefault()
    const result = calcularPladur({
      nome: nome || 'Divisória Pladur',
      comprimento: parseFloat(comprimento),
      altura: parseFloat(altura),
      tipo_placa: tipoPlaca,
      dupla_face: duplaFace
    })
    setResultado(result)
    setSaved(false)
    setError(null)
  }

  const handleSalvar = async (editedResult: any) => {
    if (!editedResult) return
    setSaving(true)
    setError(null)

    const { error: saveError } = await saveCalculation(supabase, {
      tipo: 'pladur',
      nome: nome || 'Divisória Pladur',
      dados: {
        comprimento: parseFloat(comprimento),
        altura: parseFloat(altura),
        tipo_placa: tipoPlaca,
        dupla_face: duplaFace
      },
      resultado: editedResult,
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
      title="Calculadora de Pladur"
      onCalculate={handleCalcular}
      onSave={handleSalvar}
      saving={saving}
      saved={saved}
      error={error}
      resultado={resultado}
      renderResultHeader={() => (
        <>
          <ResultRow label="Área total:" value={`${formatNumber(resultado!.area_total, 1)}m²`} />
          <ResultRow label="Placas necessárias:" value={`🧱 ${resultado!.materiais.find(m => m.nome.includes('Placa'))?.quantidade || 0} un`} highlight />
        </>
      )}
    >
      <FormInput label="Nome da obra" value={nome} onChange={setNome} placeholder="Ex: Parede da sala" />
      
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Comprimento" type="number" step="0.1" required value={comprimento} onChange={setComprimento} placeholder="4.0" unit="m" />
        <FormInput label="Altura" type="number" step="0.1" required value={altura} onChange={setAltura} placeholder="2.5" unit="m" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipo de Placa</label>
          <select
            value={tipoPlaca}
            onChange={(e) => setTipoPlaca(e.target.value as TipoPlaca)}
            className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none transition-all"
          >
            <option value="standard">Standard (Branca)</option>
            <option value="hidrofuga">Hidrófuga (Verde - WC)</option>
            <option value="fogo">Corta-Fogo (Rosa)</option>
          </select>
        </div>
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={duplaFace}
              onChange={(e) => setDuplaFace(e.target.checked)}
              className="w-5 h-5 rounded text-primary focus:ring-primary border-slate-300"
            />
            <span className="text-sm font-semibold text-slate-700">Dupla face?</span>
          </label>
        </div>
      </div>
    </CalculatorLayout>
  )
}
