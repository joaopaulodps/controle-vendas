'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApiMutation } from '@/hooks/useApiMutation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Message } from '@/components/ui/Message'
import { NovoClienteForm } from '@/components/forms/NovoClienteForm'

interface Cliente { id: number; nome: string; cpf: string | null; telefone: string | null }
interface ItemSorteio { numero: number; clienteId: number | null; nomeCliente: string; createdAt: string }
interface ProdutoSorteio {
  id: number; sorteioId: number; produtoId: number; quantidade: number; precoUnitario: string; createdAt: string
  produto: { id: number; nome: string; estoque: number; unidade: string }
}
interface Produto {
  id: number; nome: string; codigoProduto: string | null; estoque: number; unidade: string
  marca?: { id: number; nome: string } | null
}
interface SorteioList {
  id: number; nome: string; descricao: string | null; totalNumeros: number
  valorIngresso: string; dataSorteio: string | null; status: string
  _count: { itens: number; vendas: number }
}
interface SorteioDetail extends SorteioList {
  itens: ItemSorteio[]
  produtosSorteio: ProdutoSorteio[]
}

function SorteioForm({
  form,
  setForm,
  onSubmit,
  isPending,
}: {
  form: { nome: string; descricao: string; totalNumeros: string; valorIngresso: string; dataSorteio: string }
  setForm: (f: any) => void
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
}) {
  return (
    <div className="card mb-6">
      <h2 className="text-lg font-semibold mb-4 dark:text-white">Novo Sorteio</h2>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="label">Nome *</label>
          <input type="text" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="input" />
        </div>
        <div>
          <label className="label">Descrição</label>
          <input type="text" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} className="input" />
        </div>
        <div>
          <label className="label">Total de Números *</label>
          <input type="number" required min={1} value={form.totalNumeros} onChange={e => setForm({ ...form, totalNumeros: e.target.value })} className="input" />
        </div>
        <div>
          <label className="label">Valor do Ingresso (R$) *</label>
          <input type="number" step="0.01" required min={0} value={form.valorIngresso} onChange={e => setForm({ ...form, valorIngresso: e.target.value })} className="input" />
        </div>
        <div>
          <label className="label">Data do Sorteio</label>
          <input type="date" value={form.dataSorteio} onChange={e => setForm({ ...form, dataSorteio: e.target.value })} className="input" />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-success" disabled={isPending}>Criar Sorteio</button>
        </div>
      </form>
    </div>
  )
}

function SorteioLista({
  sorteios,
  isLoading,
  sorteioSelecionadoId,
  onSelect,
}: {
  sorteios: SorteioList[]
  isLoading: boolean
  sorteioSelecionadoId: number | null
  onSelect: (id: number) => void
}) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4 dark:text-white">Lista de Sorteios</h2>
      {isLoading ? (
        <p className="text-muted">Carregando...</p>
      ) : sorteios.length === 0 ? (
        <p className="text-muted">Nenhum sorteio cadastrado.</p>
      ) : (
        <div className="space-y-3">
          {sorteios.map(s => (
            <div
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                sorteioSelecionadoId === s.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-600'
                  : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium dark:text-white">{s.nome}</h3>
                  <p className="text-sm text-muted">
                    {s._count.itens}/{s.totalNumeros} números • {formatCurrency(Number(s.valorIngresso))}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  s.status === 'aberto' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  s.status === 'finalizado' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MapaNumeros({
  sorteio,
  filtroNumero,
  onFiltroChange,
}: {
  sorteio: SorteioDetail
  filtroNumero: string
  onFiltroChange: (v: string) => void
}) {
  const mapa = useMemo(() => {
    const vendidos = new Set(sorteio.itens.map(i => i.numero))
    const resultado = []
    for (let i = 1; i <= sorteio.totalNumeros; i++) {
      const item = sorteio.itens.find(it => it.numero === i)
      resultado.push({ numero: i, vendido: vendidos.has(i), cliente: item?.nomeCliente || null })
    }
    if (filtroNumero) {
      return resultado.filter(m => String(m.numero).includes(filtroNumero) || (m.cliente && m.cliente.toLowerCase().includes(filtroNumero.toLowerCase())))
    }
    return resultado
  }, [sorteio, filtroNumero])

  function imprimirMapa() {
    const mapaCompleto = []
    for (let i = 1; i <= sorteio.totalNumeros; i++) {
      const item = sorteio.itens.find(it => it.numero === i)
      mapaCompleto.push({ numero: i, vendido: !!item, cliente: item?.nomeCliente || '' })
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const cellSize = Math.max(36, Math.min(50, Math.floor(700 / Math.ceil(Math.sqrt(sorteio.totalNumeros)))))
    const cols = Math.floor(700 / (cellSize + 4))

    let cellsHtml = ''
    for (const m of mapaCompleto) {
      const bg = m.vendido ? '#ef4444' : '#22c55e'
      cellsHtml += `<div style="width:${cellSize}px;height:${cellSize}px;display:flex;align-items:center;justify-content:center;background:${bg};color:white;border-radius:4px;font-size:12px;font-weight:500;">${m.numero}</div>`
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Mapa de Números - ${sorteio.nome}</title>
          <style>
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          </style>
        </head>
        <body style="font-family:Arial,sans-serif;padding:20px;">
          <h2 style="margin:0 0 4px 0;">${sorteio.nome}</h2>
          <p style="margin:0 0 2px 0;color:#666;font-size:13px;">${sorteio.totalNumeros - sorteio._count.itens} disponíveis / ${sorteio._count.itens} vendidos</p>
          <div style="display:flex;gap:12px;margin:8px 0 16px 0;font-size:12px;">
            <span>● <span style="color:#22c55e;">Disponível</span></span>
            <span>● <span style="color:#ef4444;">Vendido</span></span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(${cols}, ${cellSize + 4}px);gap:4px;">
            ${cellsHtml}
          </div>
          <script>window.onload=function(){window.print();window.close();}<\/script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="card mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium dark:text-white">Mapa de Números</h3>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Buscar número ou cliente..."
            value={filtroNumero}
            onChange={e => onFiltroChange(e.target.value)}
            className="input max-w-xs text-sm"
          />
          <button onClick={imprimirMapa} className="btn-secondary text-xs whitespace-nowrap">
            🖨 Imprimir
          </button>
        </div>
      </div>
      <div className="flex gap-4 mb-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block"></span> Disponível</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block"></span> Vendido</span>
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-16 gap-1.5">
        {mapa.map(m => (
          <div
            key={m.numero}
            title={m.vendido ? `${m.numero} - ${m.cliente}` : `${m.numero} - Disponível`}
            className={`aspect-square flex items-center justify-center rounded text-xs font-medium cursor-default ${
              m.vendido
                ? 'bg-red-400 text-white dark:bg-red-600'
                : 'bg-green-400 text-white dark:bg-green-600'
            }`}
          >
            {m.numero}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted mt-2">
        {sorteio.totalNumeros - sorteio._count.itens} disponíveis / {sorteio._count.itens} vendidos
      </p>
    </div>
  )
}

function ProdutosVinculados({
  sorteio,
  produtos,
  produtosVinculados,
  formProduto,
  onFormChange,
  onAdd,
  onEdit,
  onRemove,
  editandoProduto,
  onEditStart,
  onEditCancel,
  isPending,
}: {
  sorteio: SorteioDetail
  produtos: Produto[]
  produtosVinculados: ProdutoSorteio[]
  formProduto: { produtoId: string; quantidade: string; precoUnitario: string }
  onFormChange: (f: any) => void
  onAdd: (e: React.FormEvent) => void
  onEdit: (item: ProdutoSorteio) => void
  onRemove: (itemId: number) => void
  editandoProduto: number | null
  onEditStart: (item: ProdutoSorteio) => void
  onEditCancel: () => void
  isPending: boolean
}) {
  const [editForm, setEditForm] = useState({ quantidade: '', precoUnitario: '' })
  const [editId, setEditId] = useState<number | null>(null)

  function startEdit(item: ProdutoSorteio) {
    setEditId(item.id)
    setEditForm({ quantidade: String(item.quantidade), precoUnitario: item.precoUnitario })
  }

  function cancelEdit() {
    setEditId(null)
    setEditForm({ quantidade: '', precoUnitario: '' })
  }

  async function saveEdit() {
    if (!editId) return
    try {
      const res = await fetch(`/api/sorteios/${sorteio.id}/produtos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: editId, quantidade: parseInt(editForm.quantidade), precoUnitario: parseFloat(editForm.precoUnitario) }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error)
        return
      }
      cancelEdit()
      onEdit({ id: editId } as ProdutoSorteio)
    } catch (err) {
      alert('Erro ao atualizar')
    }
  }

  const produtosDisponiveis = produtos.filter(p => {
    const jaVinculado = produtosVinculados.some(v => v.produtoId === p.id)
    return !jaVinculado
  })

  const custoTotal = produtosVinculados.reduce((acc, item) => acc + item.quantidade * Number(item.precoUnitario), 0)

  return (
    <div className="card">
      <h3 className="font-medium mb-2 dark:text-white">Produtos Vinculados</h3>

      {sorteio.status === 'aberto' && (
        <form onSubmit={onAdd} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
          <div>
            <label className="text-xs text-muted mb-1 block">Produto *</label>
            <select
              value={formProduto.produtoId}
              onChange={e => onFormChange({ ...formProduto, produtoId: e.target.value })}
              className="input text-sm"
              required
            >
              <option value="">Selecione...</option>
              {produtosDisponiveis.map(p => (
                <option key={p.id} value={p.id}>{p.nome} (Estoque: {p.estoque} {p.unidade})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Quantidade *</label>
            <input
              type="number"
              min={1}
              required
              value={formProduto.quantidade}
              onChange={e => onFormChange({ ...formProduto, quantidade: e.target.value })}
              className="input text-sm"
              placeholder="Qtd"
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Preço Unitário (R$) *</label>
            <input
              type="number"
              step="0.01"
              min={0}
              required
              value={formProduto.precoUnitario}
              onChange={e => onFormChange({ ...formProduto, precoUnitario: e.target.value })}
              className="input text-sm"
              placeholder="0,00"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-success w-full text-sm" disabled={isPending}>Vincular</button>
          </div>
        </form>
      )}

      {produtosVinculados.length === 0 ? (
        <p className="text-muted text-sm">Nenhum produto vinculado.</p>
      ) : (
        <>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full">
              <thead className="table-header sticky top-0">
                <tr>
                  <th className="table-cell text-left">Produto</th>
                  <th className="table-cell text-center">Qtd</th>
                  <th className="table-cell text-right">Preço Unit.</th>
                  <th className="table-cell text-right">Subtotal</th>
                  {sorteio.status === 'aberto' && <th className="table-cell text-center">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {produtosVinculados.map(item => (
                  <tr key={item.id} className="table-row">
                    <td className="table-cell text-sm font-medium">{item.produto.nome}</td>
                    <td className="table-cell text-center text-sm">
                      {editId === item.id ? (
                        <input type="number" min={1} value={editForm.quantidade} onChange={e => setEditForm({ ...editForm, quantidade: e.target.value })} className="input text-xs py-1 w-16 text-center" />
                      ) : (
                        item.quantidade
                      )}
                    </td>
                    <td className="table-cell text-right text-sm">
                      {editId === item.id ? (
                        <input type="number" step="0.01" min={0} value={editForm.precoUnitario} onChange={e => setEditForm({ ...editForm, precoUnitario: e.target.value })} className="input text-xs py-1 w-24 text-right" />
                      ) : (
                        formatCurrency(Number(item.precoUnitario))
                      )}
                    </td>
                    <td className="table-cell text-right text-sm font-medium">
                      {editId === item.id
                        ? formatCurrency(parseInt(editForm.quantidade || '0') * parseFloat(editForm.precoUnitario || '0'))
                        : formatCurrency(item.quantidade * Number(item.precoUnitario))
                      }
                    </td>
                    {sorteio.status === 'aberto' && (
                      <td className="table-cell text-center">
                        {editId === item.id ? (
                          <>
                            <button onClick={saveEdit} className="text-green-600 hover:underline text-xs mr-2" disabled={isPending}>Salvar</button>
                            <button onClick={cancelEdit} className="text-gray-500 hover:underline text-xs">Cancelar</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(item)} className="text-blue-600 hover:underline text-xs mr-2 dark:text-blue-400">Editar</button>
                            <button onClick={() => onRemove(item.id)} className="text-red-600 hover:underline text-xs" disabled={isPending}>Remover</button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 pt-3 border-t dark:border-gray-700 flex justify-between items-center">
            <span className="text-sm font-medium dark:text-white">Custo Total:</span>
            <span className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(custoTotal)}</span>
          </div>
        </>
      )}
    </div>
  )
}

function NumerosVendidos({
  sorteio,
  clientes,
  editandoItem,
  editItemForm,
  onEditItem,
  onEditItemFormChange,
  onSaveEdit,
  onCancelEdit,
  onRemove,
  onEdit,
  isPending,
}: {
  sorteio: SorteioDetail
  clientes: Cliente[]
  editandoItem: number | null
  editItemForm: { clienteId: string; nomeCliente: string }
  onEditItem: (numero: number) => void
  onEditItemFormChange: (f: any) => void
  onSaveEdit: (numero: number) => void
  onCancelEdit: () => void
  onRemove: (numero: number) => void
  onEdit: (item: ItemSorteio) => void
  isPending: boolean
}) {
  return (
    <div className="card">
      <h3 className="font-medium mb-2 dark:text-white">Números Vendidos</h3>
      {sorteio.itens.length === 0 ? (
        <p className="text-muted text-sm">Nenhum número vendido ainda.</p>
      ) : (
        <div className="max-h-48 overflow-y-auto">
          <table className="w-full">
            <thead className="table-header sticky top-0">
              <tr>
                <th className="table-cell text-left">Nº</th>
                <th className="table-cell text-left">Cliente</th>
                <th className="table-cell text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {sorteio.itens.map(item => (
                <tr key={item.numero} className="table-row">
                  {editandoItem === item.numero ? (
                    <>
                      <td className="table-cell font-medium">{item.numero}</td>
                      <td className="table-cell">
                        <select value={editItemForm.clienteId} onChange={e => onEditItemFormChange({ ...editItemForm, clienteId: e.target.value })} className="input text-xs py-1">
                          <option value="">Selecione...</option>
                          {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </td>
                      <td className="table-cell text-center">
                        <button onClick={() => onSaveEdit(item.numero)} className="text-green-600 hover:underline text-xs mr-2" disabled={isPending}>Salvar</button>
                        <button onClick={onCancelEdit} className="text-gray-500 hover:underline text-xs">Cancelar</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="table-cell font-medium">{item.numero}</td>
                      <td className="table-cell text-sm">{item.nomeCliente}</td>
                      <td className="table-cell text-center">
                        <button onClick={() => onEdit(item)} className="text-blue-600 hover:underline text-xs mr-2 dark:text-blue-400">Editar</button>
                        <button onClick={() => onRemove(item.numero)} className="text-red-600 hover:underline text-xs" disabled={isPending}>Remover</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function SorteiosPage() {
  const [showForm, setShowForm] = useState(false)
  const [sorteioSelecionadoId, setSorteioSelecionadoId] = useState<number | null>(null)
  const [form, setForm] = useState({ nome: '', descricao: '', totalNumeros: '', valorIngresso: '', dataSorteio: '' })
  const [editandoSorteio, setEditandoSorteio] = useState(false)
  const [formEdit, setFormEdit] = useState({ nome: '', descricao: '', totalNumeros: '', valorIngresso: '', dataSorteio: '' })
  const [itemForm, setItemForm] = useState({ numero: '', clienteId: '' })
  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false)
  const [editandoItem, setEditandoItem] = useState<number | null>(null)
  const [editItemForm, setEditItemForm] = useState({ clienteId: '', nomeCliente: '' })
  const [msg, setMsg] = useState('')
  const [filtroNumero, setFiltroNumero] = useState('')
  const [produtoForm, setProdutoForm] = useState({ produtoId: '', quantidade: '', precoUnitario: '' })
  const [editandoProduto, setEditandoProduto] = useState<number | null>(null)

  const { data: sorteios = [], isLoading } = useQuery<SorteioList[]>({
    queryKey: ['sorteios'],
    queryFn: () => fetch('/api/sorteios').then(r => r.json()),
  })

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => fetch('/api/clientes').then(r => r.json()),
  })

  const { data: sorteioDetalhe, isLoading: loadingDetalhe } = useQuery<SorteioDetail>({
    queryKey: ['sorteio', sorteioSelecionadoId],
    queryFn: () => fetch(`/api/sorteios/${sorteioSelecionadoId}`).then(r => r.json()),
    enabled: !!sorteioSelecionadoId,
  })

  const { data: produtos = [] } = useQuery<Produto[]>({
    queryKey: ['produtos'],
    queryFn: () => fetch('/api/produtos').then(r => r.json()),
  })

  const { data: produtosVinculados = [], refetch: refetchProdutos } = useQuery<ProdutoSorteio[]>({
    queryKey: ['produtosSorteio', sorteioSelecionadoId],
    queryFn: () => fetch(`/api/sorteios/${sorteioSelecionadoId}/produtos`).then(r => r.json()),
    enabled: !!sorteioSelecionadoId,
  })

  const mutation = useApiMutation({
    invalidateKeys: ['sorteios', 'clientes', 'produtos'],
    onSuccess: () => {
      if (sorteioSelecionadoId) {
        refetchProdutos()
      }
    },
  })

  async function criarSorteio(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    try {
      await mutation.mutateAsync({
        method: 'POST',
        url: '/api/sorteios',
        body: {
          nome: form.nome,
          descricao: form.descricao || null,
          totalNumeros: parseInt(form.totalNumeros),
          valorIngresso: parseFloat(form.valorIngresso),
          dataSorteio: form.dataSorteio || null,
        },
      })
      setForm({ nome: '', descricao: '', totalNumeros: '', valorIngresso: '', dataSorteio: '' })
      setShowForm(false)
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  async function salvarEdicaoSorteio() {
    if (!sorteioSelecionadoId) return
    try {
      await mutation.mutateAsync({
        method: 'PUT',
        url: `/api/sorteios/${sorteioSelecionadoId}`,
        body: {
          nome: formEdit.nome,
          descricao: formEdit.descricao || null,
          totalNumeros: parseInt(formEdit.totalNumeros),
          valorIngresso: parseFloat(formEdit.valorIngresso),
          dataSorteio: formEdit.dataSorteio || null,
        },
      })
      setEditandoSorteio(false)
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  async function adicionarItem(e: React.FormEvent) {
    e.preventDefault()
    if (!sorteioSelecionadoId) return
    setMsg('')

    const cliente = clientes.find(c => c.id === Number(itemForm.clienteId))
    if (!cliente) { setMsg('Selecione um cliente'); return }

    try {
      await mutation.mutateAsync({
        method: 'POST',
        url: `/api/sorteios/${sorteioSelecionadoId}/itens`,
        body: { numero: parseInt(itemForm.numero), clienteId: cliente.id, nomeCliente: cliente.nome },
      })
      setItemForm({ numero: '', clienteId: '' })
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  async function salvarEdicaoItem(numero: number) {
    if (!sorteioSelecionadoId) return
    const cliente = clientes.find(c => c.id === Number(editItemForm.clienteId))
    try {
      await mutation.mutateAsync({
        method: 'PUT',
        url: `/api/sorteios/${sorteioSelecionadoId}/itens`,
        body: { numero, clienteId: cliente?.id || null, nomeCliente: editItemForm.nomeCliente },
      })
      setEditandoItem(null)
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function removerItem(numero: number) {
    if (!sorteioSelecionadoId) return
    try {
      await mutation.mutateAsync({
        method: 'DELETE',
        url: `/api/sorteios/${sorteioSelecionadoId}/itens?numero=${numero}`,
      })
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  async function excluirSorteio(id: number) {
    if (!confirm('Excluir este sorteio?')) return
    try {
      await mutation.mutateAsync({ method: 'DELETE', url: `/api/sorteios/${id}` })
      setSorteioSelecionadoId(null)
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  async function atualizarStatus(id: number, status: string) {
    try {
      await mutation.mutateAsync({
        method: 'PUT',
        url: `/api/sorteios/${id}`,
        body: { status },
      })
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  const handleSelectSorteio = useCallback((id: number) => {
    setSorteioSelecionadoId(id)
    setEditandoSorteio(false)
    setEditandoItem(null)
  }, [])

  const handleEditItem = useCallback((item: ItemSorteio) => {
    setEditandoItem(item.numero)
    setEditItemForm({ clienteId: item.clienteId ? String(item.clienteId) : '', nomeCliente: item.nomeCliente })
  }, [])

  async function vincularProduto(e: React.FormEvent) {
    e.preventDefault()
    if (!sorteioSelecionadoId) return
    setMsg('')
    try {
      const res = await fetch(`/api/sorteios/${sorteioSelecionadoId}/produtos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produtoId: parseInt(produtoForm.produtoId),
          quantidade: parseInt(produtoForm.quantidade),
          precoUnitario: parseFloat(produtoForm.precoUnitario),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setMsg(data.error)
        return
      }
      setProdutoForm({ produtoId: '', quantidade: '', precoUnitario: '' })
      refetchProdutos()
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  async function removerProdutoVinculado(itemId: number) {
    if (!sorteioSelecionadoId) return
    if (!confirm('Remover este produto da vinculação?')) return
    try {
      const res = await fetch(`/api/sorteios/${sorteioSelecionadoId}/produtos?itemId=${itemId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        setMsg(data.error)
        return
      }
      refetchProdutos()
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  async function refreshProdutos() {
    refetchProdutos()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sorteios</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancelar' : '+ Novo Sorteio'}
        </button>
      </div>

      <Message msg={msg} />

      {showForm && (
        <SorteioForm
          form={form}
          setForm={setForm}
          onSubmit={criarSorteio}
          isPending={mutation.isPending}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${sorteioSelecionadoId ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
          <SorteioLista
            sorteios={sorteios}
            isLoading={isLoading}
            sorteioSelecionadoId={sorteioSelecionadoId}
            onSelect={handleSelectSorteio}
          />
        </div>

        {sorteioSelecionadoId && (
          <div className="lg:col-span-2 space-y-6">
            {loadingDetalhe ? (
              <div className="card text-center py-8 text-muted">Carregando detalhes...</div>
            ) : sorteioDetalhe && (
              <div className="card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    {editandoSorteio ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="text" value={formEdit.nome} onChange={e => setFormEdit({ ...formEdit, nome: e.target.value })} className="input" placeholder="Nome" />
                        <input type="text" value={formEdit.descricao} onChange={e => setFormEdit({ ...formEdit, descricao: e.target.value })} className="input" placeholder="Descrição" />
                        <input type="number" value={formEdit.totalNumeros} onChange={e => setFormEdit({ ...formEdit, totalNumeros: e.target.value })} className="input" placeholder="Total números" />
                        <input type="number" step="0.01" value={formEdit.valorIngresso} onChange={e => setFormEdit({ ...formEdit, valorIngresso: e.target.value })} className="input" placeholder="Valor ingresso" />
                        <input type="date" value={formEdit.dataSorteio} onChange={e => setFormEdit({ ...formEdit, dataSorteio: e.target.value })} className="input" />
                        <div className="flex gap-2">
                          <button onClick={salvarEdicaoSorteio} className="btn-success" disabled={mutation.isPending}>Salvar</button>
                          <button onClick={() => setEditandoSorteio(false)} className="btn-secondary">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-lg font-semibold dark:text-white">{sorteioDetalhe.nome}</h2>
                        {sorteioDetalhe.descricao && <p className="text-sm text-muted">{sorteioDetalhe.descricao}</p>}
                        {sorteioDetalhe.dataSorteio && <p className="text-xs text-muted mt-1">Data: {formatDate(sorteioDetalhe.dataSorteio)}</p>}
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!editandoSorteio && (
                      <button onClick={() => {
                        setFormEdit({
                          nome: sorteioDetalhe.nome,
                          descricao: sorteioDetalhe.descricao || '',
                          totalNumeros: String(sorteioDetalhe.totalNumeros),
                          valorIngresso: sorteioDetalhe.valorIngresso,
                          dataSorteio: sorteioDetalhe.dataSorteio ? sorteioDetalhe.dataSorteio.split('T')[0] : '',
                        })
                        setEditandoSorteio(true)
                      }} className="btn-secondary text-xs">Editar</button>
                    )}
                    {sorteioDetalhe.status === 'aberto' && (
                      <button onClick={() => atualizarStatus(sorteioDetalhe.id, 'finalizado')} className="btn-primary text-xs" disabled={mutation.isPending}>Finalizar</button>
                    )}
                    <button onClick={() => excluirSorteio(sorteioDetalhe.id)} className="btn-danger text-xs" disabled={mutation.isPending}>Excluir</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <p className="text-sm text-muted">Vendidos</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {sorteioDetalhe._count.itens}/{sorteioDetalhe.totalNumeros}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <p className="text-sm text-muted">Valor Ingresso</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(Number(sorteioDetalhe.valorIngresso))}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <p className="text-sm text-muted">Arrecadado</p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {formatCurrency(sorteioDetalhe._count.itens * Number(sorteioDetalhe.valorIngresso))}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <p className="text-sm text-muted">Custo Produtos</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(produtosVinculados.reduce((acc, item) => acc + item.quantidade * Number(item.precoUnitario), 0))}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg dark:bg-gray-700 md:col-span-2">
                    <p className="text-sm text-muted">
                      {(() => {
                        const arrecadado = sorteioDetalhe._count.itens * Number(sorteioDetalhe.valorIngresso)
                        const custo = produtosVinculados.reduce((acc, item) => acc + item.quantidade * Number(item.precoUnitario), 0)
                        const lucro = arrecadado - custo
                        return lucro >= 0 ? 'Lucro' : 'Prejuízo'
                      })()}
                    </p>
                    <p className={`text-xl font-bold ${(() => {
                      const arrecadado = sorteioDetalhe._count.itens * Number(sorteioDetalhe.valorIngresso)
                      const custo = produtosVinculados.reduce((acc, item) => acc + item.quantidade * Number(item.precoUnitario), 0)
                      return arrecadado - custo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    })()}`}>
                      {(() => {
                        const arrecadado = sorteioDetalhe._count.itens * Number(sorteioDetalhe.valorIngresso)
                        const custo = produtosVinculados.reduce((acc, item) => acc + item.quantidade * Number(item.precoUnitario), 0)
                        return formatCurrency(arrecadado - custo)
                      })()}
                    </p>
                  </div>
                </div>

                {sorteioDetalhe.status === 'aberto' && (
                  <div className="mb-6">
                    <h3 className="font-medium mb-2 dark:text-white">Adicionar Número</h3>
                    <form onSubmit={adicionarItem} className="flex gap-2 items-end">
                      <div className="w-24">
                        <label className="text-xs text-muted mb-1 block">Nº</label>
                        <input type="number" min={1} max={sorteioDetalhe.totalNumeros} required value={itemForm.numero} onChange={e => setItemForm({ ...itemForm, numero: e.target.value })} className="input" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-muted mb-1 block">Cliente *</label>
                        <select value={itemForm.clienteId} onChange={e => {
                          if (e.target.value === 'novo') { setMostrarNovoCliente(true) }
                          else { setItemForm({ ...itemForm, clienteId: e.target.value }) }
                        }} className="input" required>
                          <option value="">Selecione um cliente...</option>
                          {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} {c.cpf ? `- ${c.cpf}` : ''}</option>)}
                          <option value="novo">+ Cadastrar novo cliente</option>
                        </select>
                      </div>
                      <button type="submit" className="btn-success" disabled={mutation.isPending}>Adicionar</button>
                    </form>

                    {mostrarNovoCliente && (
                      <div className="mt-3">
                        <NovoClienteForm
                          onSelectCliente={(cliente) => {
                            setItemForm({ ...itemForm, clienteId: String(cliente.id) })
                            setMostrarNovoCliente(false)
                          }}
                          mutation={mutation}
                        />
                      </div>
                    )}
                  </div>
                )}

                <MapaNumeros
                  sorteio={sorteioDetalhe}
                  filtroNumero={filtroNumero}
                  onFiltroChange={setFiltroNumero}
                />

                <ProdutosVinculados
                  sorteio={sorteioDetalhe}
                  produtos={produtos}
                  produtosVinculados={produtosVinculados}
                  formProduto={produtoForm}
                  onFormChange={setProdutoForm}
                  onAdd={vincularProduto}
                  onEdit={refreshProdutos}
                  onRemove={removerProdutoVinculado}
                  editandoProduto={editandoProduto}
                  onEditStart={(item) => setEditandoProduto(item.id)}
                  onEditCancel={() => setEditandoProduto(null)}
                  isPending={mutation.isPending}
                />

                <NumerosVendidos
                  sorteio={sorteioDetalhe}
                  clientes={clientes}
                  editandoItem={editandoItem}
                  editItemForm={editItemForm}
                  onEditItem={setEditandoItem}
                  onEditItemFormChange={setEditItemForm}
                  onSaveEdit={salvarEdicaoItem}
                  onCancelEdit={() => setEditandoItem(null)}
                  onRemove={removerItem}
                  onEdit={handleEditItem}
                  isPending={mutation.isPending}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}