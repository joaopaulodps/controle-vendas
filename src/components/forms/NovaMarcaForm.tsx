import { useState, memo } from 'react'

interface Marca {
  id: number
  nome: string
}

interface NovaMarcaFormProps {
  marcas: Marca[]
  onSelectMarca: (marcaId: string) => void
  onMarcaCriada?: (marca: Marca) => void
  mutation: { isPending: boolean; mutateAsync: (data: any) => Promise<any> }
}

export const NovaMarcaForm = memo(function NovaMarcaForm({
  marcas,
  onSelectMarca,
  mutation,
}: NovaMarcaFormProps) {
  const [mostrarNovaMarca, setMostrarNovaMarca] = useState(false)
  const [novaMarcaNome, setNovaMarcaNome] = useState('')

  async function cadastrarNovaMarca() {
    if (!novaMarcaNome.trim()) return
    try {
      const marca = await mutation.mutateAsync({
        method: 'POST',
        url: '/api/marcas',
        body: { nome: novaMarcaNome.trim() },
      })
      onSelectMarca(String(marca.id))
      setNovaMarcaNome('')
      setMostrarNovaMarca(false)
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <>
      <select
        value=""
        onChange={e => {
          if (e.target.value === 'novo') {
            setMostrarNovaMarca(true)
          } else {
            onSelectMarca(e.target.value)
          }
        }}
        className="input"
      >
        <option value="">Selecione...</option>
        {marcas.map(m => (
          <option key={m.id} value={m.id}>{m.nome}</option>
        ))}
        <option value="novo">+ Cadastrar nova marca</option>
      </select>

      {mostrarNovaMarca && (
        <div className="mt-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600 flex gap-2 items-end">
          <div className="flex-1 max-w-xs">
            <label className="text-xs text-muted mb-1 block">Nome da Marca *</label>
            <input
              type="text"
              value={novaMarcaNome}
              onChange={e => setNovaMarcaNome(e.target.value)}
              className="input"
            />
          </div>
          <button
            type="button"
            onClick={cadastrarNovaMarca}
            className="btn-success"
            disabled={mutation.isPending}
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={() => { setMostrarNovaMarca(false); setNovaMarcaNome('') }}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>
      )}
    </>
  )
})