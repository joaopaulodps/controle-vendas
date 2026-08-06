'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DataTable } from '@/components/ui/DataTable'

interface Produto { id: number; nome: string; estoque: number; unidade: string }

export default function EstoquePage() {
  const [filtro, setFiltro] = useState('')

  const { data: produtos = [], isLoading } = useQuery<Produto[]>({
    queryKey: ['produtos'],
    queryFn: () => fetch('/api/produtos').then(r => r.json()),
  })

  const produtosFiltrados = useMemo(() =>
    produtos.filter(p => p.nome.toLowerCase().includes(filtro.toLowerCase())),
    [produtos, filtro]
  )

  const stats = useMemo(() => ({
    totalItens: produtos.reduce((s, p) => s + p.estoque, 0),
    totalProdutos: produtos.length,
    estoqueBaixo: produtos.filter(p => p.estoque > 0 && p.estoque <= 5).length,
    semEstoque: produtos.filter(p => p.estoque === 0).length,
  }), [produtos])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Controle de Estoque</h1>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
            <p className="text-sm text-muted">Total de Itens</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalItens}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
            <p className="text-sm text-muted">Produtos Cadastrados</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalProdutos}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
            <p className="text-sm text-muted">Estoque Baixo</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.estoqueBaixo}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
            <p className="text-sm text-muted">Sem Estoque</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.semEstoque}</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar produto..."
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          className="input max-w-sm"
        />
      </div>

      <DataTable
        data={produtosFiltrados}
        isLoading={isLoading}
        columns={[
          { key: 'nome', label: 'Produto', className: 'text-left font-medium' },
          {
            key: 'estoque',
            label: 'Estoque',
            className: 'text-right',
            render: (p: Produto) => `${p.estoque} ${p.unidade}`
          },
          {
            key: 'status',
            label: 'Status',
            className: 'text-center',
            render: (p: Produto) => (
              p.estoque === 0 ? (
                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Sem estoque</span>
              ) : p.estoque <= 5 ? (
                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Estoque baixo</span>
              ) : (
                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">OK</span>
              )
            )
          }
        ]}
        emptyMessage="Nenhum produto encontrado."
      />
    </div>
  )
}