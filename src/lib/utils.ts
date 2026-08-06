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

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '-'
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('pt-BR')
  } catch {
    return '-'
  }
}

export function formaPagamentoLabel(v: string): string {
  return FORMAS_PAGAMENTO_MAP[v] || v
}

export function calcularTotalItens(
  itens: { quantidade: number; precoEstimado: number; precoReal: number; usarPrecoReal: boolean }[]
): number {
  return itens.reduce((s, i) => s + i.quantidade * (i.usarPrecoReal ? i.precoReal : i.precoEstimado), 0)
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

export function statusParcela(dataVencimento: string, dataPagamento: string | null | undefined) {
  if (dataPagamento) return { label: 'Pago', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
  const dias = diasAteVencimento(dataVencimento)
  if (dias < 0) return { label: `Vencido`, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
  if (dias === 0) return { label: 'Vence hoje', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' }
  if (dias <= 3) return { label: `Vence em ${dias}d`, className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' }
  return { label: 'Pendente', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
}