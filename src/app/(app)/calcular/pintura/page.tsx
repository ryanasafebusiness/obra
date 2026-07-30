'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Calculator, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { calcularPintura, type PinturaResult } from '@/lib/calculations/pintura'
import { saveCalculation } from '@/lib/calculations/save'
import { createClient } from '@/lib/supabase/client'
import { formatNumber, formatCurrency } from '@/lib/utils'
import { fetchPrecosCategoria, precoMedioPorTermo, type MaterialPreco } from '@/lib/materials'

import { CalculatorLayout, FormInput, ResultRow } from '@/components/CalculatorLayout'

// Rendimento (m² por litro) não tem campo próprio no formulário — usa-se o
// valor médio para tinta de interior.
const RENDIMENTO_PADRAO = 10

export default function PinturaPage() {
  const supabase = createClient()
  const [precos, setPrecos] = useState<MaterialPreco[]>([])
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPrecosCategoria(supabase, 'pintura').then(setPrecos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCalcular = (e: React.FormEvent) => {
    e.preventDefault()
    const result = calcularPintura(
      {
        nome: nome || 'Pintura',
        comprimento: parseFloat(comprimento),
        altura: parseFloat(altura),
        quantidade_paredes: parseInt(paredes),
        area_portas: parseFloat(portas),
        area_janelas: parseFloat(janelas),
        demaos: parseInt(demaos),
        rendimento: RENDIMENTO_PADRAO,
      },
      {
        tinta_litro: precoMedioPorTermo(precos, 'Tinta Interior', 7),
        rolo: precoMedioPorTermo(precos, 'Rolo', 5),
        pincel: precoMedioPorTermo(precos, 'Pincel', 3),
        fita: precoMedioPorTermo(precos, 'Fita', 3),
        plastico: precoMedioPorTermo(precos, 'Plástico', 4),
      }
    )
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
      <FormInput label="Nome da obra" value={nome} onChange={setNome} placeholder="Ex: Sala de estar" helpText="Identificação para guardar o cálculo." />
      
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Comprimento" type="number" step="0.1" required value={comprimento} onChange={setComprimento} placeholder="4.0" unit="m" helpText="Medida linear de uma parede." />
        <FormInput label="Altura" type="number" step="0.1" required value={altura} onChange={setAltura} placeholder="2.5" unit="m" helpText="Pé direito da divisão." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Nº de Paredes" type="number" required value={paredes} onChange={setParedes} placeholder="4" helpText="Com as mesmas dimensões." />
        <FormInput label="Nº de Demãos" type="number" required value={demaos} onChange={setDemaos} placeholder="2" helpText="Camadas de tinta a aplicar." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Área Portas" type="number" step="0.1" required value={portas} onChange={setPortas} placeholder="1.6" unit="m²" helpText="Para descontar área que não leva tinta." />
        <FormInput label="Área Janelas" type="number" step="0.1" required value={janelas} onChange={setJanelas} placeholder="1.2" unit="m²" helpText="Para descontar área que não leva tinta." />
      </div>
    </CalculatorLayout>
  )
}
