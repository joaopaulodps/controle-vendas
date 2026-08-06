import { memo } from 'react'
import { formatCurrency } from '@/lib/utils'

interface Parcela {
  valor: number
  dataVencimento: string
  editavel: boolean
}

interface ParcelaFormProps {
  parcelas: Parcela[]
  totalItens: number
  onChangeQuantidade: (qtd: number) => void
  onToggleEditavel: (index: number) => void
  onUpdateParcela: (index: number, field: 'valor' | 'dataVencimento', value: any) => void
  disabled?: boolean
}

export const ParcelaForm = memo(function ParcelaForm({
  parcelas,
  totalItens,
  onChangeQuantidade,
  onToggleEditavel,
  onUpdateParcela,
  disabled = false,
}: ParcelaFormProps) {
  const totalPagamento = parcelas.reduce((s, p) => s + p.valor, 0)
  const diferenca = totalPagamento - totalItens

  return (
    <div className="border-t pt-4 dark:border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="label">Quantidade de Parcelas</label>
          <select
            value={parcelas.length}
            onChange={e => onChangeQuantidade(Number(e.target.value))}
            className="input"
            disabled={disabled}
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={3}>3x</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div>
            <label className="label">Total Pagamento</label>
            <div className="input bg-gray-50 dark:bg-gray-700 font-bold">
              {formatCurrency(totalPagamento)}
            </div>
          </div>
          {Math.abs(diferenca) > 0.01 && (
            <div className="text-xs text-orange-600 dark:text-orange-400 pt-6">
              Diferença: {formatCurrency(diferenca)}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {parcelas.map((pag, i) => (
          <div key={i} className="flex gap-2 items-end">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 w-16 pt-2">
              {i + 1}ª
            </div>
            <div className="w-36">
              <label className="text-xs text-muted mb-1 block">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={pag.valor}
                onChange={e => onUpdateParcela(i, 'valor', e.target.value)}
                disabled={!pag.editavel || disabled}
                className={`input ${!pag.editavel ? 'bg-gray-100 dark:bg-gray-600 opacity-70' : ''}`}
              />
            </div>
            <div className="w-40">
              <label className="text-xs text-muted mb-1 block">Vencimento</label>
              <input
                type="date"
                value={pag.dataVencimento}
                onChange={e => onUpdateParcela(i, 'dataVencimento', e.target.value)}
                className="input"
                disabled={disabled}
              />
            </div>
            <button
              type="button"
              onClick={() => onToggleEditavel(i)}
              disabled={disabled}
              className={`text-xs px-2 py-2 rounded mb-0.5 ${
                pag.editavel
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {pag.editavel ? '手动' : '自动'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
})