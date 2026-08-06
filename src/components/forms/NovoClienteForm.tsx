import { useState, memo } from 'react'

interface Cliente {
  id: number
  nome: string
  cpf: string | null
  telefone: string | null
}

interface NovoClienteFormProps {
  onSelectCliente: (cliente: Cliente) => void
  mutation: { isPending: boolean; mutateAsync: (data: any) => Promise<any> }
}

export const NovoClienteForm = memo(function NovoClienteForm({
  onSelectCliente,
  mutation,
}: NovoClienteFormProps) {
  const [novoCliente, setNovoCliente] = useState({ nome: '', cpf: '', telefone: '', email: '' })

  async function cadastrarNovoCliente() {
    if (!novoCliente.nome) return
    try {
      const clienteCriado = await mutation.mutateAsync({
        method: 'POST',
        url: '/api/clientes',
        body: novoCliente,
      })
      onSelectCliente(clienteCriado)
      setNovoCliente({ nome: '', cpf: '', telefone: '', email: '' })
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
      <h3 className="text-sm font-medium mb-3 dark:text-white">Novo Cliente</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-muted mb-1 block">Nome *</label>
          <input
            type="text"
            value={novoCliente.nome}
            onChange={e => setNovoCliente({ ...novoCliente, nome: e.target.value })}
            className="input"
          />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">CPF</label>
          <input
            type="text"
            value={novoCliente.cpf}
            onChange={e => setNovoCliente({ ...novoCliente, cpf: e.target.value })}
            className="input"
          />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Telefone</label>
          <input
            type="text"
            value={novoCliente.telefone}
            onChange={e => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
            className="input"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={cadastrarNovoCliente}
            className="btn-success"
            disabled={mutation.isPending}
          >
            Salvar
          </button>
          <button type="button" className="btn-secondary">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
})