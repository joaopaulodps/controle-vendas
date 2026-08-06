'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApiMutation } from '@/hooks/useApiMutation'
import { formatCurrency, formatDate, formaPagamentoLabel, calcularTotalItens, FORMAS_PAGAMENTO } from '@/lib/utils'
import { Message } from '@/components/ui/Message'
import { ItemForm } from '@/components/forms/ItemForm'
import { ParcelaForm } from '@/components/forms/ParcelaForm'
import { NovoClienteForm } from '@/components/forms/NovoClienteForm'

interface Cliente { id: number; nome: string; cpf: string | null; telefone: string | null }
interface Produto { id: number; nome: string; estoque: number; codigoProduto: string | null }
interface Item { produtoId: number; quantidade: number; precoEstimado: number; precoReal: number; usarPrecoReal: boolean }
interface Parcela { valor: number; dataVencimento: string; editavel: boolean }
interface Sorteio { id: number; nome: string; totalNumeros: number; status: string }
interface Venda {
  id: number; cliente: string; dataVenda: string; valorTotal: string; sorteioId: number | null
  itens: { produto: { nome: string }; quantidade: number; precoEstimado: string; precoReal: string }[]
  pagamentos: { formaPagamento: string; parcela: number; valor: string; dataVencimento: string }[]
  sorteio: { nome: string } | null
}

export default function VendasPage() {
  const [clienteId, setClienteId] = useState<number | null>(null)
  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false)
  const [observacao, setObservacao] = useState('')
  const [isSorteio, setIsSorteio] = useState(false)
  const [sorteioId, setSorteioId] = useState<number | null>(null)
  const [itens, setItens] = useState<Item[]>([{ produtoId: 0, quantidade: 1, precoEstimado: 0, precoReal: 0, usarPrecoReal: false }])
  const [formaPagamento, setFormaPagamento] = useState('pix')
  const [parcelas, setParcelas] = useState<Parcela[]>([{ valor: 0, dataVencimento: '', editavel: false }])
  const [msg, setMsg] = useState('')

  const { data: vendas = [], isLoading } = useQuery<Venda[]>({
    queryKey: ['vendas'],
    queryFn: () => fetch('/api/vendas').then(r => r.json()),
  })

  const { data: produtos = [] } = useQuery<Produto[]>({
    queryKey: ['produtos'],
    queryFn: () => fetch('/api/produtos').then(r => r.json()),
  })

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => fetch('/api/clientes').then(r => r.json()),
  })

  const { data: sorteios = [] } = useQuery<Sorteio[]>({
    queryKey: ['sorteios'],
    queryFn: () => fetch('/api/sorteios').then(r => r.json()),
  })

  const mutation = useApiMutation({ invalidateKeys: ['vendas', 'produtos'] })

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

  async function cadastrarNovoCliente() {
    if (!msg) setMsg('')
    setMostrarNovoCliente(true)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const validos = itens.filter(i => i.produtoId > 0 && i.quantidade > 0)

    if (isSorteio && !sorteioId) { setMsg('Selecione um sorteio'); return }
    if (!isSorteio && !clienteId) { setMsg('Selecione um cliente ou cadastre um novo'); return }
    if (validos.length === 0) { setMsg('Adicione pelo menos um item'); return }

    if (!isSorteio) {
      const pagsValidas = parcelas.filter(p => p.valor > 0 && p.dataVencimento)
      if (pagsValidas.length === 0) { setMsg('Preencha pelo menos uma parcela com valor e data de vencimento'); return }
    }

    const cliente = clientes.find(c => c.id === clienteId)
    const itensParaEnviar = validos.map(i => ({
      produtoId: i.produtoId,
      quantidade: i.quantidade,
      precoEstimado: i.precoEstimado,
      precoReal: i.usarPrecoReal ? i.precoReal : i.precoEstimado,
    }))

    const pagsValidas = parcelas.filter(p => p.valor > 0 && p.dataVencimento)
    const pagamentosParaEnviar = pagsValidas.map((p, idx) => ({
      formaPagamento,
      parcela: idx + 1,
      valor: p.valor,
      dataVencimento: p.dataVencimento,
    }))

    const clienteFinal = isSorteio ? `Sorteio: ${sorteios.find(s => s.id === sorteioId)?.nome || ''}` : (cliente?.nome || '')

    try {
      await mutation.mutateAsync({
        method: 'POST',
        url: '/api/vendas',
        body: {
          cliente: clienteFinal,
          clienteId: isSorteio ? null : clienteId,
          observacao,
          itens: itensParaEnviar,
          pagamentos: isSorteio ? [] : pagamentosParaEnviar,
          sorteioId: isSorteio ? sorteioId : null,
        },
      })
      setClienteId(null)
      setObservacao('')
      setIsSorteio(false)
      setSorteioId(null)
      setItens([{ produtoId: 0, quantidade: 1, precoEstimado: 0, precoReal: 0, usarPrecoReal: false }])
      setFormaPagamento('pix')
      setParcelas([{ valor: 0, dataVencimento: '', editavel: false }])
      setMsg('Venda registrada com sucesso!')
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Vendas</h1>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Nova Venda</h2>
        <Message msg={msg} />
        <form onSubmit={salvar} className="space-y-6">
          <div className="flex gap-4 items-center mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isSorteio} onChange={e => { setIsSorteio(e.target.checked); setClienteId(null); setSorteioId(null) }} className="rounded border-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vincular a Sorteio</span>
            </label>
          </div>

          {isSorteio ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Sorteio *</label>
                <select value={sorteioId || ''} onChange={e => setSorteioId(Number(e.target.value) || null)} className="input" required>
                  <option value="">Selecione um sorteio...</option>
                  {sorteios.filter(s => s.status === 'aberto').map(s => (
                    <option key={s.id} value={s.id}>{s.nome} ({s.totalNumeros} números)</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Cliente *</label>
                  <select value={clienteId || ''} onChange={e => {
                    if (e.target.value === 'novo') { setMostrarNovoCliente(true); setClienteId(null) }
                    else { setClienteId(Number(e.target.value) || null); setMostrarNovoCliente(false) }
                  }} className="input" required>
                    <option value="">Selecione um cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} {c.cpf ? `- ${c.cpf}` : ''}</option>)}
                    <option value="novo">+ Cadastrar novo cliente</option>
                  </select>
                </div>
                <div>
                  <label className="label">Observação</label>
                  <input type="text" value={observacao} onChange={e => setObservacao(e.target.value)} className="input" />
                </div>
              </div>

              {mostrarNovoCliente && (
                <NovoClienteForm
                  onSelectCliente={(cliente) => {
                    setClienteId(cliente.id)
                    setMostrarNovoCliente(false)
                    setMsg('Cliente cadastrado com sucesso!')
                  }}
                  mutation={mutation}
                />
              )}
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Itens</label>
              <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:underline dark:text-blue-400">+ Adicionar item</button>
            </div>
            <ItemForm
              itens={itens}
              produtos={produtos}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onUpdateItem={updateItem}
              showPrice={!isSorteio}
            />
            {!isSorteio && (
              <div className="text-right mt-2 text-lg font-bold text-gray-700 dark:text-gray-300">
                Total: {formatCurrency(totalItens)}
              </div>
            )}
          </div>

          {!isSorteio && (
            <ParcelaForm
              parcelas={parcelas}
              totalItens={totalItens}
              onChangeQuantidade={mudarQtdParcelas}
              onToggleEditavel={toggleEditavel}
              onUpdateParcela={updateParcela}
            />
          )}

          <button type="submit" className="btn-success" disabled={mutation.isPending}>
            {isSorteio ? 'Registrar Venda (Sorteio)' : 'Registrar Venda'}
          </button>
        </form>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="table-cell text-left">#</th>
              <th className="table-cell text-left">Cliente</th>
              <th className="table-cell text-left">Data</th>
              <th className="table-cell text-left">Itens</th>
              <th className="table-cell text-right">Total</th>
              <th className="table-cell text-left">Pagamento</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {isLoading ? (
              <tr><td colSpan={6} className="table-cell text-center py-8 text-muted">Carregando...</td></tr>
            ) : vendas.length === 0 ? (
              <tr><td colSpan={6} className="table-cell text-center py-8 text-muted">Nenhuma venda registrada.</td></tr>
            ) : vendas.map(v => (
              <tr key={v.id} className="table-row">
                <td className="table-cell">{v.id}</td>
                <td className="table-cell font-medium">
                  {v.cliente}
                  {v.sorteio && <span className="ml-2 px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Sorteio</span>}
                </td>
                <td className="table-cell">{formatDate(v.dataVenda)}</td>
                <td className="table-cell text-muted text-xs">{v.itens.map(i => `${i.produto.nome} x${i.quantidade}`).join(', ')}</td>
                <td className="table-cell text-right font-bold text-green-600">
                  {v.sorteio ? '-' : formatCurrency(Number(v.valorTotal))}
                </td>
                <td className="table-cell text-xs">
                  {v.pagamentos?.map((p, idx) => (
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