'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApiMutation } from '@/hooks/useApiMutation'
import { Message } from '@/components/ui/Message'
import { DataTable } from '@/components/ui/DataTable'

interface Cliente {
  id: number; nome: string; cpf: string | null; telefone: string | null
  email: string | null; endereco: string | null; observacao: string | null
}

export default function ClientesPage() {
  const [form, setForm] = useState({ nome: '', cpf: '', telefone: '', email: '', endereco: '', observacao: '' })
  const [editando, setEditando] = useState<number | null>(null)
  const [msg, setMsg] = useState('')

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => fetch('/api/clientes').then(r => r.json()),
  })

  const mutation = useApiMutation({ invalidateKeys: ['clientes'] })

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const data = {
      nome: form.nome,
      cpf: form.cpf || null,
      telefone: form.telefone || null,
      email: form.email || null,
      endereco: form.endereco || null,
      observacao: form.observacao || null,
    }

    try {
      if (editando) {
        await mutation.mutateAsync({ method: 'PUT', url: `/api/clientes/${editando}`, body: data })
      } else {
        await mutation.mutateAsync({ method: 'POST', url: '/api/clientes', body: data })
      }
      setForm({ nome: '', cpf: '', telefone: '', email: '', endereco: '', observacao: '' })
      setEditando(null)
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  function editar(c: Cliente) {
    setForm({ nome: c.nome, cpf: c.cpf || '', telefone: c.telefone || '', email: c.email || '', endereco: c.endereco || '', observacao: c.observacao || '' })
    setEditando(c.id)
  }

  async function excluir(id: number) {
    if (!confirm('Excluir este cliente?')) return
    try {
      await mutation.mutateAsync({ method: 'DELETE', url: `/api/clientes/${id}` })
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Clientes</h1>

      <Message msg={msg} />

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">{editando ? 'Editar Cliente' : 'Novo Cliente'}</h2>
        <form onSubmit={salvar} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Nome *</label>
            <input type="text" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">CPF</label>
            <input type="text" value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input type="text" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Endereço</label>
            <input type="text" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Observação</label>
            <input type="text" value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} className="input" />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>{editando ? 'Atualizar' : 'Cadastrar'}</button>
            {editando && <button type="button" onClick={() => { setEditando(null); setForm({ nome: '', cpf: '', telefone: '', email: '', endereco: '', observacao: '' }) }} className="btn-secondary">Cancelar</button>}
          </div>
        </form>
      </div>

      <DataTable
        data={clientes}
        isLoading={isLoading}
        columns={[
          { key: 'nome', label: 'Nome', className: 'text-left font-medium' },
          { key: 'cpf', label: 'CPF', className: 'text-left text-muted', render: (c: Cliente) => c.cpf || '-' },
          { key: 'telefone', label: 'Telefone', className: 'text-left text-muted', render: (c: Cliente) => c.telefone || '-' },
          { key: 'email', label: 'Email', className: 'text-left text-muted', render: (c: Cliente) => c.email || '-' },
          {
            key: 'acoes',
            label: 'Ações',
            className: 'text-center',
            render: (c: Cliente) => (
              <>
                <button onClick={() => editar(c)} className="text-blue-600 hover:underline mr-3 dark:text-blue-400">Editar</button>
                <button onClick={() => excluir(c.id)} className="text-red-600 hover:underline dark:text-red-400">Excluir</button>
              </>
            )
          }
        ]}
        emptyMessage="Nenhum cliente cadastrado."
      />
    </div>
  )
}