'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BUDGET_STATUS, CALCULATOR_MODULES, PROJECT_STATUS } from '@/lib/constants'
import type { Budget, Calculation, Client, Project } from '@/types/database'

type ObraCompleta = Project & {
  clients: Client | null
  budgets: Budget[]
  calculations: Calculation[]
}

const COR_PRIMARIA: [number, number, number] = [249, 115, 22]
const COR_TEXTO: [number, number, number] = [28, 25, 23]
const COR_MUTED: [number, number, number] = [120, 113, 108]
const COR_LINHA: [number, number, number] = [229, 231, 235]
const MARGEM = 20
const LARGURA_UTIL = 190

export function ObraPdfButton({ obra }: { obra: ObraCompleta }) {
  const [gerando, setGerando] = useState(false)

  const handleDownload = async () => {
    setGerando(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      let y = 25

      const novaPaginaSeNecessario = (espacoNecessario: number) => {
        if (y + espacoNecessario > 280) {
          doc.addPage()
          y = 25
        }
      }

      // Header
      doc.setFontSize(20)
      doc.setTextColor(...COR_PRIMARIA)
      doc.text('RELATÓRIO DE OBRA', MARGEM, y)
      y += 9

      doc.setFontSize(16)
      doc.setTextColor(...COR_TEXTO)
      doc.text(obra.nome, MARGEM, y)
      y += 7

      doc.setFontSize(10)
      doc.setTextColor(...COR_MUTED)
      const estado = PROJECT_STATUS[obra.status]?.label || obra.status
      doc.text(`Estado: ${estado}  ·  Gerado em: ${formatDate(new Date().toISOString())}`, MARGEM, y)
      y += 12

      // Dados da obra
      doc.setDrawColor(...COR_LINHA)
      doc.line(MARGEM, y, MARGEM + LARGURA_UTIL, y)
      y += 8

      doc.setFontSize(11)
      doc.setTextColor(...COR_PRIMARIA)
      doc.text('DADOS DA OBRA', MARGEM, y)
      y += 8

      doc.setFontSize(10)
      doc.setTextColor(...COR_TEXTO)

      if (obra.clients) {
        doc.text(`Cliente: ${obra.clients.nome}`, MARGEM, y)
        y += 6
        if (obra.clients.telefone) {
          doc.text(`Telefone: ${obra.clients.telefone}`, MARGEM, y)
          y += 6
        }
        if (obra.clients.morada) {
          doc.text(`Morada: ${obra.clients.morada}`, MARGEM, y)
          y += 6
        }
      }

      if (obra.tipo_servico) {
        doc.text(`Serviço: ${obra.tipo_servico}`, MARGEM, y)
        y += 6
      }

      if (obra.data_inicio || obra.data_fim) {
        const inicio = obra.data_inicio ? formatDate(obra.data_inicio) : '—'
        const fim = obra.data_fim ? formatDate(obra.data_fim) : '—'
        doc.text(`Datas: ${inicio} - ${fim}`, MARGEM, y)
        y += 6
      }

      if (obra.notas) {
        doc.text('Notas:', MARGEM, y)
        y += 6
        const notasLinhas = doc.splitTextToSize(obra.notas, LARGURA_UTIL)
        doc.setTextColor(...COR_MUTED)
        doc.text(notasLinhas, MARGEM, y)
        y += notasLinhas.length * 5.5
        doc.setTextColor(...COR_TEXTO)
      }

      y += 6

      // Orçamentos
      novaPaginaSeNecessario(20)
      doc.setDrawColor(...COR_LINHA)
      doc.line(MARGEM, y, MARGEM + LARGURA_UTIL, y)
      y += 8

      doc.setFontSize(11)
      doc.setTextColor(...COR_PRIMARIA)
      doc.text(`ORÇAMENTOS (${obra.budgets?.length || 0})`, MARGEM, y)
      y += 8

      let totalOrcamentos = 0
      if (obra.budgets && obra.budgets.length > 0) {
        doc.setFontSize(9)
        doc.setTextColor(...COR_MUTED)
        doc.text('Nº', MARGEM, y)
        doc.text('Estado', MARGEM + 45, y)
        doc.text('Data', MARGEM + 90, y)
        doc.text('Total', MARGEM + LARGURA_UTIL, y, { align: 'right' })
        y += 6

        doc.setFontSize(10)
        obra.budgets.forEach((budget) => {
          novaPaginaSeNecessario(8)
          const status = BUDGET_STATUS[budget.status]?.label || budget.status
          doc.setTextColor(...COR_TEXTO)
          doc.text(budget.numero, MARGEM, y)
          doc.text(status, MARGEM + 45, y)
          doc.text(formatDate(budget.created_at), MARGEM + 90, y)
          doc.text(formatCurrency(budget.total), MARGEM + LARGURA_UTIL, y, { align: 'right' })
          y += 7
          totalOrcamentos += budget.total
        })

        y += 3
        doc.setDrawColor(...COR_LINHA)
        doc.line(MARGEM + 120, y, MARGEM + LARGURA_UTIL, y)
        y += 7
        doc.setFontSize(11)
        doc.setTextColor(...COR_PRIMARIA)
        doc.text(`Total em orçamentos: ${formatCurrency(totalOrcamentos)}`, MARGEM + LARGURA_UTIL, y, { align: 'right' })
        y += 10
      } else {
        doc.setFontSize(10)
        doc.setTextColor(...COR_MUTED)
        doc.text('Sem orçamentos associados.', MARGEM, y)
        y += 10
      }

      // Cálculos
      novaPaginaSeNecessario(20)
      doc.setDrawColor(...COR_LINHA)
      doc.line(MARGEM, y, MARGEM + LARGURA_UTIL, y)
      y += 8

      doc.setFontSize(11)
      doc.setTextColor(...COR_PRIMARIA)
      doc.text(`CÁLCULOS (${obra.calculations?.length || 0})`, MARGEM, y)
      y += 8

      if (obra.calculations && obra.calculations.length > 0) {
        doc.setFontSize(9)
        doc.setTextColor(...COR_MUTED)
        doc.text('Nome', MARGEM, y)
        doc.text('Tipo', MARGEM + 80, y)
        doc.text('Data', MARGEM + 120, y)
        doc.text('Custo est.', MARGEM + LARGURA_UTIL, y, { align: 'right' })
        y += 6

        doc.setFontSize(10)
        obra.calculations.forEach((calc) => {
          novaPaginaSeNecessario(8)
          const modulo = CALCULATOR_MODULES.find((m) => m.id === calc.tipo)
          const custo = (calc.resultado as { custo_total_materiais?: number })?.custo_total_materiais
          doc.setTextColor(...COR_TEXTO)
          doc.text(calc.nome, MARGEM, y)
          doc.text(modulo?.nome || calc.tipo, MARGEM + 80, y)
          doc.text(formatDate(calc.created_at), MARGEM + 120, y)
          doc.text(typeof custo === 'number' ? formatCurrency(custo) : '—', MARGEM + LARGURA_UTIL, y, { align: 'right' })
          y += 7
        })
      } else {
        doc.setFontSize(10)
        doc.setTextColor(...COR_MUTED)
        doc.text('Sem cálculos associados.', MARGEM, y)
      }

      const fileName = `obra-${obra.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`
      const pdfBlob = doc.output('blob')

      if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
        try {
          await navigator.share({
            files: [new File([pdfBlob], fileName, { type: 'application/pdf' })],
            title: `Relatório — ${obra.nome}`,
          })
        } catch {
          doc.save(fileName)
        }
      } else {
        doc.save(fileName)
      }
    } finally {
      setGerando(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={gerando}
      className="w-full mt-5 py-3.5 rounded-2xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors disabled:opacity-50"
    >
      <Download className="w-5 h-5" />
      {gerando ? 'A gerar PDF...' : 'Descarregar PDF da obra'}
    </button>
  )
}
