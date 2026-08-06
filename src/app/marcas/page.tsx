'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApiMutation } from '@/hooks/useApiMutation'
import { Message } from '@/components/ui/Message'
import { DataTable } from '@/components/ui/DataTable'

interface Marca { id: number; nome: string }

export default function MarcasPage() {
  const [nome, setNome] = useState('')
  const [editando, setEditando] = useState<number | null>(null)
  const [msg, setMsg] = useState('')

  const { data: marcas = [], isLoading } = useQuery<Marca[]>({
    queryKey: ['marcas'],
    queryFn: () => fetch('/api/marcas').then(r => r.json()),
  })

  const mutation = useApiMutation({ invalidateKeys: ['marcas'] })

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    try {
      if (editando) {
        await mutation.mutateAsync({ method: 'PUT', url: `/api/marcas/${editando}`, body: { nome } })
      } else {
        await mutation.mutateAsync({ method: 'POST', url: '/api/marcas', body: { nome } })
      }
      setNome('')
      setEditando(null)
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  function editar(marca: Marca) {
    setNome(marca.nome)
    setEditando(marca.id)
  }

  async function excluir(id: number) {
    if (!confirm('Excluir esta marca?')) return
    try {
      await mutation.mutateAsync({ method: 'DELETE', url: `/api/marcas/${id}` })
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Marcas</h1>

      <Message msg={msg} />

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">{editando ? 'Editar Marca' : 'Nova Marca'}</h2>
        <form onSubmit={salvar} className="flex gap-3 items-end">
          <div className="flex-1 max-w-md">
            <label className="label">Nome da Marca *</label>
            <input type="text" required value={nome} onChange={e => setNome(e.target.value)} className="input" />
          </div>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>{editando ? 'Atualizar' : 'Cadastrar'}</button>
          {editando && (
            <button type="button" onClick={() => { setEditando(null); setNome('') }} className="btn-secondary">Cancelar</button>
          )}
        </form>
      </div>

      <DataTable
        data={marcas}
        isLoading={isLoading}
        columns={[
          { key: 'nome', label: 'Nome', className: 'text-left font-medium' },
          {
            key: 'acoes',
            label: 'Ações',
            className: 'text-center',
            render: (m: Marca) => (
              <>
                <button onClick={() => editar(m)} className="text-blue-600 hover:underline mr-3 dark:text-blue-400">Editar</button>
                <button onClick={() => excluir(m.id)} className="text-red-600 hover:underline dark:text-red-400">Excluir</button>
              </>
            )
          }
        ]}
        emptyMessage="Nenhuma marca cadastrada."
      />
    </div>
  )
}