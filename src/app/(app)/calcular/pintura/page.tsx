'use client'

import { useState } from 'react'
import { ArrowLeft, Save, Calculator, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { calcularPintura, type PinturaResult } from '@/lib/calculations/pintura'
import { saveCalculation } from '@/lib/calculations/save'
import { createClient } from '@/lib/supabase/client'
import { formatNumber, formatCurrency } from '@/lib/utils'

import { CalculatorLayout, FormInput, ResultRow } from '@/components/CalculatorLayout'

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

  const handleSalvar = async (editedResult: any, projeto: { projetoId: string; novaObraNome: string }) => {
    if (!editedResult) return
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
      title="Calculadora de Pintura"
      onCalculate={handleCalcular}
      onSave={handleSalvar}
      saving={saving}
      saved={saved}
      error={error}
      resultado={resultado}
      renderResultHeader={() => (
        <>
          <ResultRow label="Área total:" value={`${formatNumber(resultado!.area_total, 1)}m²`} />
          <ResultRow label="Tinta necessária:" value={`🪣 ${resultado!.materiais.find(m => m.nome === 'Tinta')?.quantidade || 0} ${resultado!.materiais.find(m => m.nome === 'Tinta')?.unidade || ''} (${resultado!.litros_necessarios}L)`} highlight />
        </>
      )}
    >
      <FormInput label="Nome do ambiente" value={nome} onChange={setNome} placeholder="Ex: Sala de estar" />

      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Comprimento" type="number" step="0.1" required value={comprimento} onChange={setComprimento} placeholder="5.0" unit="m" />
        <FormInput label="Altura" type="number" step="0.1" required value={altura} onChange={setAltura} placeholder="3.0" unit="m" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Paredes" type="number" step="1" required value={paredes} onChange={setParedes} placeholder="4" />
        <FormInput label="Demãos" type="number" step="1" required value={demaos} onChange={setDemaos} placeholder="2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Área de portas" type="number" step="0.1" required value={portas} onChange={setPortas} placeholder="1.6" unit="m²" />
        <FormInput label="Área de janelas" type="number" step="0.1" required value={janelas} onChange={setJanelas} placeholder="1.2" unit="m²" />
      </div>
    </CalculatorLayout>
  )
}
