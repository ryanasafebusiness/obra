'use client'

import { useState, useEffect } from 'react'
import { calcularPiso, type PisoResult } from '@/lib/calculations/piso'
import { saveCalculation } from '@/lib/calculations/save'
import { createClient } from '@/lib/supabase/client'
import { formatNumber } from '@/lib/utils'
import { fetchPrecosCategoria, precoMedioPorTermo, type MaterialPreco } from '@/lib/materials'
import { CalculatorLayout, FormInput, ResultRow } from '@/components/CalculatorLayout'

// Liga o valor escolhido no <select> ao termo de pesquisa na tabela
// materials e ao preço médio por omissão (caso não haja correspondência).
const TIPO_PISO_INFO: Record<string, { termo: string; fallback: number }> = {
  flutuante: { termo: 'Flutuante', fallback: 12 },
  vinilico: { termo: 'Vinílico', fallback: 18 },
  ceramico: { termo: 'Cerâmico', fallback: 15 },
}

export default function PisoPage() {
  const supabase = createClient()
  const [precos, setPrecos] = useState<MaterialPreco[]>([])
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPrecosCategoria(supabase, 'piso').then(setPrecos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCalcular = (e: React.FormEvent) => {
    e.preventDefault()
    const tipoInfo = TIPO_PISO_INFO[tipoPiso] || TIPO_PISO_INFO.flutuante
    const result = calcularPiso(
      {
        nome: nome || 'Colocação de Piso',
        comprimento: parseFloat(comprimento),
        largura: parseFloat(largura),
        tipo_piso: tipoPiso,
        m2_por_caixa: parseFloat(m2PorCaixa),
        margem_desperdicio: parseFloat(margem)
      },
      {
        pavimento_m2: precoMedioPorTermo(precos, tipoInfo.termo, tipoInfo.fallback),
        cola: precoMedioPorTermo(precos, 'Cola', 15),
        rejunte: precoMedioPorTermo(precos, 'Rejunte', 8),
        espacadores: precoMedioPorTermo(precos, 'Espaçadores', 2),
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
      <FormInput label="Nome da obra" value={nome} onChange={setNome} placeholder="Ex: Chão da sala" helpText="Identificação para guardar o cálculo." />
      
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Comprimento" type="number" step="0.1" required value={comprimento} onChange={setComprimento} placeholder="5.0" unit="m" helpText="Medida linear." />
        <FormInput label="Largura" type="number" step="0.1" required value={largura} onChange={setLargura} placeholder="4.0" unit="m" helpText="Medida linear." />
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
          <p className="mt-1.5 text-xs text-slate-500">O material a aplicar.</p>
        </div>
        <div className="space-y-4">
          <FormInput label="m²/Caixa" type="number" step="0.01" required value={m2PorCaixa} onChange={setM2PorCaixa} placeholder="2.4" helpText="Ver na embalagem." />
          <FormInput label="Margem" type="number" step="1" required value={margem} onChange={setMargem} placeholder="10" unit="%" helpText="Cortes e rodapés." />
        </div>
      </div>
    </CalculatorLayout>
  )
}
