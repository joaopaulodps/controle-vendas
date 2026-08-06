'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatCurrency, formatDate, FORMAS_PAGAMENTO_MAP } from '@/lib/utils'
import { Message } from '@/components/ui/Message'

interface Pagamento {
  id: number
  tipo: 'compra' | 'venda'
  referenciaId: number
  referenciaNome: string
  formaPagamento: string
  parcela: number
  valor: number
  dataVencimento: string
  dataPagamento: string | null
  pago: boolean
}

function toDate(d: string) {
  return new Date(d + (d.includes('T') ? '' : 'T00:00:00'))
}

function diasAteVencimento(dataVencimento: string) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const vencimento = toDate(dataVencimento)
  return Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

function statusVencimento(dataVencimento: string, pago: boolean) {
  if (pago) return { label: 'Pago', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
  const dias = diasAteVencimento(dataVencimento)
  if (dias < 0) return { label: `Vencido há ${Math.abs(dias)} dia(s)`, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
  if (dias === 0) return { label: 'Vence hoje', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' }
  if (dias <= 3) return { label: `Vence em ${dias} dia(s)`, className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' }
  return { label: `Vence em ${dias} dia(s)`, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
}

export default function PagamentosPage() {
  const queryClient = useQueryClient()
  const [filtro, setFiltro] = useState('pendentes')
  const [dataPagamento, setDataPagamento] = useState('')
  const [pagandoId, setPagandoId] = useState<number | null>(null)
  const [msg, setMsg] = useState('')

  const { data: pagamentos = [], isLoading } = useQuery<Pagamento[]>({
    queryKey: ['pagamentos', filtro],
    queryFn: () => fetch(`/api/pagamentos?filtro=${filtro}`).then(r => r.json()),
  })

  const mutation = useMutation({
    mutationFn: async (data: { id: number; tipo: string; dataPagamento?: string }) => {
      const res = await fetch('/api/pagamentos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao registrar pagamento')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] })
    },
  })

  const statusMap = useMemo(() => {
    const map = new Map<number, { label: string; className: string }>()
    for (const p of pagamentos) {
      map.set(p.id, statusVencimento(p.dataVencimento, p.pago))
    }
    return map
  }, [pagamentos])

  async function marcarComoPago(id: number, tipo: string) {
    setMsg('')
    try {
      await mutation.mutateAsync({ id, tipo, dataPagamento: dataPagamento || undefined })
      setMsg('Pagamento registrado com sucesso!')
      setPagandoId(null)
      setDataPagamento('')
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Pagamentos</h1>

      <Message msg={msg} />

      <div className="flex gap-2 mb-4">
        {[
          { value: 'pendentes', label: 'Pendentes' },
          { value: 'vencidos', label: 'Vencidos' },
          { value: 'pagos', label: 'Pagos' },
          { value: 'todos', label: 'Todos' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filtro === f.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="table-cell text-left">Tipo</th>
              <th className="table-cell text-left">Fornecedor/Cliente</th>
              <th className="table-cell text-center">Parcela</th>
              <th className="table-cell text-left">Forma Pgto</th>
              <th className="table-cell text-right">Valor</th>
              <th className="table-cell text-left">Vencimento</th>
              <th className="table-cell text-center">Status</th>
              <th className="table-cell text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {isLoading ? (
              <tr><td colSpan={8} className="table-cell text-center py-8 text-muted">Carregando...</td></tr>
            ) : pagamentos.length === 0 ? (
              <tr><td colSpan={8} className="table-cell text-center py-8 text-muted">Nenhum pagamento encontrado.</td></tr>
            ) : pagamentos.map(p => {
              const status = statusMap.get(p.id) || { label: '', className: '' }
              return (
                <tr key={`${p.tipo}-${p.id}`} className="table-row">
                  <td className="table-cell">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.tipo === 'compra' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                      {p.tipo === 'compra' ? 'Compra' : 'Venda'}
                    </span>
                  </td>
                  <td className="table-cell font-medium">{p.referenciaNome}</td>
                  <td className="table-cell text-center">{p.parcela}ª</td>
                  <td className="table-cell text-muted">{FORMAS_PAGAMENTO_MAP[p.formaPagamento] || p.formaPagamento}</td>
                  <td className="table-cell text-right font-medium">{formatCurrency(p.valor)}</td>
                  <td className="table-cell">{formatDate(p.dataVencimento)}</td>
                  <td className="table-cell text-center">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                    {p.pago && p.dataPagamento && (
                      <p className="text-xs text-muted mt-1">Pago em {formatDate(p.dataPagamento)}</p>
                    )}
                  </td>
                  <td className="table-cell text-center">
                    {p.pago ? (
                      <span className="text-green-600 dark:text-green-400 text-sm">✓ Pago</span>
                    ) : pagandoId === p.id ? (
                      <div className="flex gap-1 items-center justify-center">
                        <input
                          type="date"
                          value={dataPagamento}
                          onChange={e => setDataPagamento(e.target.value)}
                          className="input text-xs py-1 w-32"
                        />
                        <button onClick={() => marcarComoPago(p.id, p.tipo)} className="text-green-600 hover:underline text-xs font-medium" disabled={mutation.isPending}>Confirmar</button>
                        <button onClick={() => { setPagandoId(null); setDataPagamento('') }} className="text-gray-500 hover:underline text-xs">Cancelar</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setPagandoId(p.id); setDataPagamento(new Date().toISOString().split('T')[0]) }}
                        className="text-blue-600 hover:underline text-sm dark:text-blue-400"
                      >
                        Marcar como pago
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}