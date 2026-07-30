import Link from 'next/link'
import { ArrowLeft, Save, Calculator, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Material {
  nome: string
  quantidade: number
  unidade: string
  preco_estimado: number
}

interface CalculatorLayoutProps {
  title: string
  icon?: string
  children: React.ReactNode // Form elements go here
  onCalculate: (e: React.FormEvent) => void
  onSave: () => void
  saving: boolean
  saved: boolean
  error?: string | null
  resultado: {
    materiais: Material[]
    custo_total_materiais: number
  } | null
  renderResultHeader?: () => React.ReactNode // Custom result details like Area, Litros
}

export function CalculatorLayout({
  title,
  children,
  onCalculate,
  onSave,
  saving,
  saved,
  error,
  resultado,
  renderResultHeader
}: CalculatorLayoutProps) {
  return (
    <div className="px-5 pt-8 pb-8 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/calcular" className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {title}
          </h1>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="floating-card p-6 mb-6">
        <form onSubmit={onCalculate} className="space-y-5">
          {children}

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
          {renderResultHeader && (
            <div className="floating-card p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-100">
              <h2 className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-4">
                Resultado em destaque
              </h2>
              <div className="space-y-4">
                {renderResultHeader()}
              </div>
            </div>
          )}

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
            onClick={onSave}
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

export function FormInput({ 
  label, value, onChange, placeholder, type = "text", step, required = false, unit 
}: { 
  label: string, value: string, onChange: (val: string) => void, placeholder?: string, type?: string, step?: string, required?: boolean, unit?: string 
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`w-full ${unit ? 'pl-4 pr-10' : 'px-4'} py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
        />
        {unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">{unit}</span>}
      </div>
    </div>
  )
}

export function ResultRow({ label, value, highlight = false }: { label: string, value: string | React.ReactNode, highlight?: boolean }) {
  return (
    <div className={`flex items-end justify-between ${highlight ? '' : 'border-b border-orange-200/50 pb-3'}`}>
      <span className="text-slate-600 font-medium">{label}</span>
      <span className={`text-2xl font-bold ${highlight ? 'text-orange-600' : 'text-slate-800'}`}>{value}</span>
    </div>
  )
}
