'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    const result = await signIn('credentials', {
      usuario,
      senha,
      redirect: false,
    })

    if (result?.error) {
      setErro('Usuário ou senha inválidos')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-blue-600">ControleVendas</h1>
            <p className="text-sm text-gray-500 mt-2">Faça login para acessar o sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                {erro}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
              <input
                type="text"
                required
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Seu usuário"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
