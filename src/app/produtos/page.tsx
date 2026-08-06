'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApiMutation } from '@/hooks/useApiMutation'
import { Message } from '@/components/ui/Message'
import { DataTable } from '@/components/ui/DataTable'
import { NovaMarcaForm } from '@/components/forms/NovaMarcaForm'

interface Marca { id: number; nome: string }
interface Produto {
  id: number; nome: string; codigoProduto: string | null
  marcaId: number | null; estoque: number; unidade: string
  marca: Marca | null
}

export default function ProdutosPage() {
  const [form, setForm] = useState({ nome: '', codigoProduto: '', marcaId: '', estoque: '', unidade: 'un' })
  const [editando, setEditando] = useState<number | null>(null)
  const [msg, setMsg] = useState('')

  const { data: produtos = [], isLoading } = useQuery<Produto[]>({
    queryKey: ['produtos'],
    queryFn: () => fetch('/api/produtos').then(r => r.json()),
  })

  const { data: marcas = [] } = useQuery<Marca[]>({
    queryKey: ['marcas'],
    queryFn: () => fetch('/api/marcas').then(r => r.json()),
  })

  const mutation = useApiMutation({ invalidateKeys: ['produtos', 'marcas'] })

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const data = {
      nome: form.nome,
      codigoProduto: form.codigoProduto,
      marcaId: form.marcaId ? Number(form.marcaId) : null,
      estoque: parseInt(form.estoque) || 0,
      unidade: form.unidade,
    }

    try {
      if (editando) {
        await mutation.mutateAsync({ method: 'PUT', url: `/api/produtos/${editando}`, body: data })
      } else {
        await mutation.mutateAsync({ method: 'POST', url: '/api/produtos', body: data })
      }
      setForm({ nome: '', codigoProduto: '', marcaId: '', estoque: '', unidade: 'un' })
      setEditando(null)
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  function editar(produto: Produto) {
    setForm({
      nome: produto.nome,
      codigoProduto: produto.codigoProduto || '',
      marcaId: produto.marcaId ? String(produto.marcaId) : '',
      estoque: String(produto.estoque),
      unidade: produto.unidade,
    })
    setEditando(produto.id)
  }

  async function excluir(id: number) {
    if (!confirm('Excluir este produto?')) return
    await mutation.mutateAsync({ method: 'DELETE', url: `/api/produtos/${id}` })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Produtos</h1>

      <Message msg={msg} />

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">{editando ? 'Editar Produto' : 'Novo Produto'}</h2>
        <form onSubmit={salvar} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Código do Produto *</label>
            <input type="text" required value={form.codigoProduto} onChange={e => setForm({ ...form, codigoProduto: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Nome do Produto *</label>
            <input type="text" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Marca</label>
            <NovaMarcaForm
              marcas={marcas}
              onSelectMarca={(marcaId) => setForm({ ...form, marcaId })}
              mutation={mutation}
            />
          </div>
          <div>
            <label className="label">Estoque</label>
            <input type="number" value={form.estoque} onChange={e => setForm({ ...form, estoque: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Unidade</label>
            <select value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })} className="input">
              <option value="un">Unidade</option>
              <option value="kg">Quilograma</option>
              <option value="lt">Litro</option>
              <option value="mt">Metro</option>
              <option value="cx">Caixa</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>{editando ? 'Atualizar' : 'Cadastrar'}</button>
            {editando && <button type="button" onClick={() => { setEditando(null); setForm({ nome: '', codigoProduto: '', marcaId: '', estoque: '', unidade: 'un' }) }} className="btn-secondary">Cancelar</button>}
          </div>
        </form>
      </div>

      <DataTable
        data={produtos}
        isLoading={isLoading}
        columns={[
          { key: 'codigoProduto', label: 'Cód. Produto', className: 'text-left font-mono text-sm', render: (p: Produto) => p.codigoProduto || '-' },
          { key: 'nome', label: 'Nome', className: 'text-left font-medium' },
          { key: 'marca', label: 'Marca', className: 'text-left text-muted', render: (p: Produto) => p.marca?.nome || '-' },
          { key: 'estoque', label: 'Estoque', className: 'text-right', render: (p: Produto) => `${p.estoque} ${p.unidade}` },
          {
            key: 'acoes',
            label: 'Ações',
            className: 'text-center',
            render: (p: Produto) => (
              <>
                <button onClick={() => editar(p)} className="text-blue-600 hover:underline mr-3 dark:text-blue-400">Editar</button>
                <button onClick={() => excluir(p.id)} className="text-red-600 hover:underline dark:text-red-400">Excluir</button>
              </>
            )
          }
        ]}
        emptyMessage="Nenhum produto cadastrado."
      />
    </div>
  )
}