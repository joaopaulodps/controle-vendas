import { useMutation, useQueryClient } from '@tanstack/react-query'

interface UseApiMutationOptions {
  invalidateKeys?: string[]
  onSuccess?: () => void
}

export function useApiMutation(options: UseApiMutationOptions = {}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: { method: string; url: string; body?: any }) => {
      const res = await fetch(data.url, {
        method: data.method,
        headers: { 'Content-Type': 'application/json' },
        ...(data.body ? { body: JSON.stringify(data.body) } : {}),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao salvar')
      }
      return res.json()
    },
    onSuccess: () => {
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] })
        })
      }
      options.onSuccess?.()
    },
  })

  return mutation
}