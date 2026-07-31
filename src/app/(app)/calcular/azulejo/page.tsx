'use client'

import { useState, useEffect } from 'react'
import { calcularAzulejo, type AzulejoResult } from '@/lib/calculations/azulejo'
import { saveCalculation } from '@/lib/calculations/save'
import { createClient } from '@/lib/supabase/client'
import { formatNumber } from '@/lib/utils'
import { fetchPrecosCategoria, precoMedioPorTermo, type MaterialPreco } from '@/lib/materials'
import { CalculatorLayout, FormInput, ResultRow } from '@/components/CalculatorLayout'

export default function AzulejoPage() {
  const supabase = createClient()
  const [precos, setPrecos] = useState<MaterialPreco[]>([])
  const [nome, setNome] = useState('')
  const [comprimentoParede, setComprimentoParede] = useState('')
  const [alturaParede, setAlturaParede] = useState('')
  const [quantidadeParedes, setQuantidadeParedes] = useState('1')
  const [larguraPeca, setLarguraPeca] = useState('')
  const [alturaPeca, setAlturaPeca] = useState('')
  const [pecasPorCaixa, setPecasPorCaixa] = useState('10')
  const [margem, setMargem] = useState('10')
  const [resultado, setResultado] = useState<AzulejoResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPrecosCategoria(supabase, 'azulejo').then(setPrecos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCalcular = (e: React.FormEvent) => {
    e.preventDefault()
    const result = calcularAzulejo(
      {
        nome: nome || 'Assentamento Azulejo',
        comprimento_parede: parseFloat(comprimentoParede),
        altura_parede: parseFloat(alturaParede),
        quantidade_paredes: parseInt(quantidadeParedes),
        largura_peca: parseFloat(larguraPeca),
        altura_peca: parseFloat(alturaPeca),
        pecas_por_caixa: parseInt(pecasPorCaixa),
        margem_desperdicio: parseFloat(margem)
      },
      {
        azulejo_m2: precoMedioPorTermo(precos, 'Azulejo', 15),
        cola: precoMedioPorTermo(precos, 'Cola', 12),
        rejunte: precoMedioPorTermo(precos, 'Rejunte', 8),
        espacadores: precoMedioPorTermo(precos, 'Espaçadores', 2),
        cruzetas: precoMedioPorTermo(precos, 'Cruzetas', 3),
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
      tipo: 'azulejo',
      nome: nome || 'Assentamento Azulejo',
      dados: {
        comprimento_parede: parseFloat(comprimentoParede),
        altura_parede: parseFloat(alturaParede),
        quantidade_paredes: parseInt(quantidadeParedes),
        largura_peca: parseFloat(larguraPeca),
        altura_peca: parseFloat(alturaPeca),
        pecas_por_caixa: parseInt(pecasPorCaixa),
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
      title="Calculadora de Azulejo"
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
          <ResultRow label="Total de peças:" value={`${resultado!.pecas_necessarias} un`} />
        </>
      )}
    >
      <FormInput label="Nome da obra" value={nome} onChange={setNome} placeholder="Ex: Casa de banho" helpText="Identificação para guardar o cálculo." />
      
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Compr. Parede" type="number" step="0.1" required value={comprimentoParede} onChange={setComprimentoParede} placeholder="3.0" unit="m" helpText="Medida linear." />
        <FormInput label="Altura Parede" type="number" step="0.1" required value={alturaParede} onChange={setAlturaParede} placeholder="2.5" unit="m" helpText="Pé direito." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Largura Peça" type="number" step="0.1" required value={larguraPeca} onChange={setLarguraPeca} placeholder="60" unit="cm" helpText="Tamanho do azulejo." />
        <FormInput label="Altura Peça" type="number" step="0.1" required value={alturaPeca} onChange={setAlturaPeca} placeholder="60" unit="cm" helpText="Tamanho do azulejo." />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormInput label="Qtd. Paredes" type="number" step="1" required value={quantidadeParedes} onChange={setQuantidadeParedes} placeholder="1" helpText="Com as mesmas dimensões." />
        <FormInput label="Peças/Caixa" type="number" step="1" required value={pecasPorCaixa} onChange={setPecasPorCaixa} placeholder="10" helpText="Ver na embalagem." />
        <FormInput label="Margem" type="number" step="1" required value={margem} onChange={setMargem} placeholder="10" unit="%" helpText="Para cortes/quebras." />
      </div>
    </CalculatorLayout>
  )
}
