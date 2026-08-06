'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApiMutation } from '@/hooks/useApiMutation'
import { formatCurrency, formatDate, formaPagamentoLabel, calcularTotalItens, FORMAS_PAGAMENTO } from '@/lib/utils'
import { Message } from '@/components/ui/Message'
import { ItemForm } from '@/components/forms/ItemForm'
import { ParcelaForm } from '@/components/forms/ParcelaForm'

interface Marca { id: number; nome: string }
interface Produto { id: number; nome: string; estoque: number; codigoProduto: string | null }
interface Item { produtoId: number; quantidade: number; precoEstimado: number; precoReal: number; usarPrecoReal: boolean }
interface Parcela { valor: number; dataVencimento: string; editavel: boolean }
interface Compra {
  id: number; fornecedor: string; dataCompra: string; valorTotal: string
  itens: { produto: { nome: string }; quantidade: number; precoEstimado: string; precoReal: string }[]
  pagamentos: { formaPagamento: string; parcela: number; valor: string; dataVencimento: string }[]
}

export default function ComprasPage() {
  const [fornecedor, setFornecedor] = useState('')
  const [observacao, setObservacao] = useState('')
  const [itens, setItens] = useState<Item[]>([{ produtoId: 0, quantidade: 1, precoEstimado: 0, precoReal: 0, usarPrecoReal: false }])
  const [formaPagamento, setFormaPagamento] = useState('pix')
  const [parcelas, setParcelas] = useState<Parcela[]>([{ valor: 0, dataVencimento: '', editavel: false }])
  const [msg, setMsg] = useState('')

  const [mostrarNovoProduto, setMostrarNovoProduto] = useState(false)
  const [novoProduto, setNovoProduto] = useState({ nome: '', codigoProduto: '', marcaId: '', estoque: '', unidade: 'un' })
  const [mostrarNovaMarca, setMostrarNovaMarca] = useState(false)
  const [novaMarcaNome, setNovaMarcaNome] = useState('')

  const { data: compras = [], isLoading } = useQuery<Compra[]>({
    queryKey: ['compras'],
    queryFn: () => fetch('/api/compras').then(r => r.json()),
  })

  const { data: produtos = [] } = useQuery<Produto[]>({
    queryKey: ['produtos'],
    queryFn: () => fetch('/api/produtos').then(r => r.json()),
  })

  const { data: marcas = [] } = useQuery<Marca[]>({
    queryKey: ['marcas'],
    queryFn: () => fetch('/api/marcas').then(r => r.json()),
  })

  const mutation = useApiMutation({ invalidateKeys: ['compras', 'produtos', 'marcas'] })

  const totalItens = useMemo(() => calcularTotalItens(itens), [itens])

  const addItem = useCallback(() => {
    setItens(prev => [...prev, { produtoId: 0, quantidade: 1, precoEstimado: 0, precoReal: 0, usarPrecoReal: false }])
  }, [])

  const removeItem = useCallback((i: number) => {
    setItens(prev => prev.filter((_, idx) => idx !== i))
  }, [])

  const updateItem = useCallback((i: number, field: keyof Item, value: any) => {
    setItens(prev => {
      const novos = [...prev]
      novos[i] = { ...novos[i], [field]: value }
      return novos
    })
  }, [])

  const mudarQtdParcelas = useCallback((qtd: number) => {
    setParcelas(prev => {
      const total = calcularTotalItens(itens)
      const valorParcela = total / qtd
      const novas: Parcela[] = []
      for (let i = 0; i < qtd; i++) {
        novas.push({
          valor: i === qtd - 1 ? Math.round((total - valorParcela * (qtd - 1)) * 100) / 100 : Math.round(valorParcela * 100) / 100,
          dataVencimento: prev[i]?.dataVencimento || '',
          editavel: false,
        })
      }
      return novas
    })
  }, [itens])

  const toggleEditavel = useCallback((i: number) => {
    setParcelas(prev => {
      const novas = [...prev]
      novas[i] = { ...novas[i], editavel: !novas[i].editavel }
      return novas
    })
  }, [])

  const updateParcela = useCallback((i: number, field: 'valor' | 'dataVencimento', value: any) => {
    setParcelas(prev => {
      const novas = [...prev]
      novas[i] = { ...novas[i], [field]: field === 'valor' ? Number(value) : value }
      return novas
    })
  }, [])

  async function cadastrarNovaMarca() {
    if (!novaMarcaNome.trim()) return
    try {
      const marca = await mutation.mutateAsync({
        method: 'POST',
        url: '/api/marcas',
        body: { nome: novaMarcaNome.trim() },
      })
      setNovoProduto({ ...novoProduto, marcaId: String(marca.id) })
      setNovaMarcaNome('')
      setMostrarNovaMarca(false)
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function cadastrarNovoProduto() {
    if (!novoProduto.nome || !novoProduto.codigoProduto) {
      setMsg('Nome e código do produto são obrigatórios')
      return
    }
    try {
      await mutation.mutateAsync({
        method: 'POST',
        url: '/api/produtos',
        body: {
          nome: novoProduto.nome,
          codigoProduto: novoProduto.codigoProduto,
          marcaId: novoProduto.marcaId ? Number(novoProduto.marcaId) : null,
          estoque: parseInt(novoProduto.estoque) || 0,
          unidade: novoProduto.unidade,
        },
      })
      setMsg('Produto cadastrado com sucesso!')
      setMostrarNovoProduto(false)
      setNovoProduto({ nome: '', codigoProduto: '', marcaId: '', estoque: '', unidade: 'un' })
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const validos = itens.filter(i => i.produtoId > 0 && i.quantidade > 0)
    if (!fornecedor || validos.length === 0) {
      setMsg('Preencha o fornecedor e adicione pelo menos um item')
      return
    }

    const pagsValidas = parcelas.filter(p => p.valor > 0 && p.dataVencimento)
    if (pagsValidas.length === 0) {
      setMsg('Preencha pelo menos uma parcela com valor e data de vencimento')
      return
    }

    const itensParaEnviar = validos.map(i => ({
      produtoId: i.produtoId,
      quantidade: i.quantidade,
      precoEstimado: i.precoEstimado,
      precoReal: i.usarPrecoReal ? i.precoReal : i.precoEstimado,
    }))

    const pagamentosParaEnviar = pagsValidas.map((p, idx) => ({
      formaPagamento,
      parcela: idx + 1,
      valor: p.valor,
      dataVencimento: p.dataVencimento,
    }))

    try {
      await mutation.mutateAsync({
        method: 'POST',
        url: '/api/compras',
        body: { fornecedor, observacao, itens: itensParaEnviar, pagamentos: pagamentosParaEnviar },
      })
      setFornecedor('')
      setObservacao('')
      setItens([{ produtoId: 0, quantidade: 1, precoEstimado: 0, precoReal: 0, usarPrecoReal: false }])
      setFormaPagamento('pix')
      setParcelas([{ valor: 0, dataVencimento: '', editavel: false }])
      setMsg('Compra registrada com sucesso!')
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Compras</h1>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Nova Compra</h2>
        <Message msg={msg} />
        <form onSubmit={salvar} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Fornecedor *</label>
              <input type="text" required value={fornecedor} onChange={e => setFornecedor(e.target.value)} className="input" placeholder="Nome do fornecedor" />
            </div>
            <div>
              <label className="label">Observação</label>
              <input type="text" value={observacao} onChange={e => setObservacao(e.target.value)} className="input" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Itens</label>
              <button type="button" onClick={() => setMostrarNovoProduto(true)} className="text-sm text-green-600 hover:underline dark:text-green-400">+ Novo produto</button>
            </div>
            <ItemForm
              itens={itens}
              produtos={produtos}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onUpdateItem={updateItem}
            />
            <div className="text-right mt-2 text-lg font-bold text-gray-700 dark:text-gray-300">
              Total: {formatCurrency(totalItens)}
            </div>
          </div>

          {mostrarNovoProduto && (
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
              <h3 className="text-sm font-medium mb-3 dark:text-white">Cadastrar Novo Produto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted mb-1 block">Código *</label>
                  <input type="text" value={novoProduto.codigoProduto} onChange={e => setNovoProduto({ ...novoProduto, codigoProduto: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Nome *</label>
                  <input type="text" value={novoProduto.nome} onChange={e => setNovoProduto({ ...novoProduto, nome: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Marca</label>
                  <select value={novoProduto.marcaId} onChange={e => {
                    if (e.target.value === 'novo') { setMostrarNovaMarca(true) }
                    else { setNovoProduto({ ...novoProduto, marcaId: e.target.value }) }
                  }} className="input">
                    <option value="">Selecione...</option>
                    {marcas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                    <option value="novo">+ Nova marca</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button type="button" onClick={cadastrarNovoProduto} className="btn-success" disabled={mutation.isPending}>Salvar</button>
                  <button type="button" onClick={() => { setMostrarNovoProduto(false); setNovoProduto({ nome: '', codigoProduto: '', marcaId: '', estoque: '', unidade: 'un' }) }} className="btn-secondary">Cancelar</button>
                </div>
              </div>
              {mostrarNovaMarca && (
                <div className="mt-3 flex gap-2 items-end">
                  <div className="flex-1 max-w-xs">
                    <label className="text-xs text-muted mb-1 block">Nome da Marca *</label>
                    <input type="text" value={novaMarcaNome} onChange={e => setNovaMarcaNome(e.target.value)} className="input" />
                  </div>
                  <button type="button" onClick={cadastrarNovaMarca} className="btn-success" disabled={mutation.isPending}>Salvar</button>
                  <button type="button" onClick={() => { setMostrarNovaMarca(false); setNovaMarcaNome('') }} className="btn-secondary">Cancelar</button>
                </div>
              )}
            </div>
          )}

          <ParcelaForm
            parcelas={parcelas}
            totalItens={totalItens}
            onChangeQuantidade={mudarQtdParcelas}
            onToggleEditavel={toggleEditavel}
            onUpdateParcela={updateParcela}
          />

          <button type="submit" className="btn-success" disabled={mutation.isPending}>Registrar Compra</button>
        </form>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="table-cell text-left">#</th>
              <th className="table-cell text-left">Fornecedor</th>
              <th className="table-cell text-left">Data</th>
              <th className="table-cell text-left">Itens</th>
              <th className="table-cell text-right">Total</th>
              <th className="table-cell text-left">Pagamento</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {isLoading ? (
              <tr><td colSpan={6} className="table-cell text-center py-8 text-muted">Carregando...</td></tr>
            ) : compras.length === 0 ? (
              <tr><td colSpan={6} className="table-cell text-center py-8 text-muted">Nenhuma compra registrada.</td></tr>
            ) : compras.map(c => (
              <tr key={c.id} className="table-row">
                <td className="table-cell">{c.id}</td>
                <td className="table-cell font-medium">{c.fornecedor}</td>
                <td className="table-cell">{formatDate(c.dataCompra)}</td>
                <td className="table-cell text-muted text-xs">{c.itens.map(i => `${i.produto.nome} x${i.quantidade}`).join(', ')}</td>
                <td className="table-cell text-right font-bold text-red-600">{formatCurrency(Number(c.valorTotal))}</td>
                <td className="table-cell text-xs">
                  {c.pagamentos.map((p, idx) => (
                    <div key={idx}>
                      {formaPagamentoLabel(p.formaPagamento)} {p.parcela}ª - {formatCurrency(Number(p.valor))}
                      <span className="text-muted ml-1">({formatDate(p.dataVencimento)})</span>
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}