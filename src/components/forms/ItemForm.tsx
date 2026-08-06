import { memo } from 'react'

interface Produto {
  id: number
  nome: string
  estoque: number
  codigoProduto: string | null
}

interface Item {
  produtoId: number
  quantidade: number
  precoEstimado: number
  precoReal: number
  usarPrecoReal: boolean
}

interface ItemFormProps {
  itens: Item[]
  produtos: Produto[]
  onAddItem: () => void
  onRemoveItem: (index: number) => void
  onUpdateItem: (index: number, field: keyof Item, value: any) => void
  showPrice?: boolean
  disabled?: boolean
}

export const ItemForm = memo(function ItemForm({
  itens,
  produtos,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  showPrice = true,
  disabled = false,
}: ItemFormProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Itens</label>
        <button
          type="button"
          onClick={onAddItem}
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          disabled={disabled}
        >
          + Adicionar item
        </button>
      </div>
      <div className="space-y-3">
        {itens.map((item, i) => (
          <div key={i} className="p-3 border rounded-lg dark:border-gray-600">
            <div className="flex gap-2 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-muted mb-1 block">Produto</label>
                <select
                  value={item.produtoId}
                  onChange={e => onUpdateItem(i, 'produtoId', Number(e.target.value))}
                  className="input"
                  disabled={disabled}
                >
                  <option value={0}>Selecione...</option>
                  {produtos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.codigoProduto} - {p.nome} (estoque: {p.estoque})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-20">
                <label className="text-xs text-muted mb-1 block">Qtd</label>
                <input
                  type="number"
                  min={1}
                  value={item.quantidade}
                  onChange={e => onUpdateItem(i, 'quantidade', Number(e.target.value))}
                  className="input"
                  disabled={disabled}
                />
              </div>
              {showPrice && (
                <>
                  <div className="w-28">
                    <label className="text-xs text-muted mb-1 block">Preço Est.</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={item.precoEstimado}
                      onChange={e => onUpdateItem(i, 'precoEstimado', Number(e.target.value))}
                      className="input"
                      disabled={disabled}
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-1">
                    <input
                      type="checkbox"
                      checked={item.usarPrecoReal}
                      onChange={e => onUpdateItem(i, 'usarPrecoReal', e.target.checked)}
                      className="rounded border-gray-300"
                      disabled={disabled}
                    />
                    <label className="text-xs text-muted whitespace-nowrap">Preço real</label>
                  </div>
                  {item.usarPrecoReal && (
                    <div className="w-28">
                      <label className="text-xs text-muted mb-1 block">Preço Real</label>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={item.precoReal}
                        onChange={e => onUpdateItem(i, 'precoReal', Number(e.target.value))}
                        className="input"
                        disabled={disabled}
                      />
                    </div>
                  )}
                </>
              )}
              {itens.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveItem(i)}
                  className="text-red-500 hover:text-red-700 text-sm pb-2"
                  disabled={disabled}
                >
                  X
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})