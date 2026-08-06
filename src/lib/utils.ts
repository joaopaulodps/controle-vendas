export const FORMAS_PAGAMENTO = [
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'credito', label: 'Cartão de Crédito' },
  { value: 'debito', label: 'Cartão de Débito' },
]

export const FORMAS_PAGAMENTO_MAP: Record<string, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  credito: 'Cartão de Crédito',
  debito: 'Cartão de Débito',
}

export function formatCurrency(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('pt-BR')
}

export function formaPagamentoLabel(v: string): string {
  return FORMAS_PAGAMENTO_MAP[v] || v
}

export function calcularTotalItens(
  itens: { quantidade: number; precoEstimado: number; precoReal: number; usarPrecoReal: boolean }[]
): number {
  return itens.reduce((s, i) => s + i.quantidade * (i.usarPrecoReal ? i.precoReal : i.precoEstimado), 0)
}