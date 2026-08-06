import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getDashboard() {
  const [totalProdutos, totalCompras, totalVendas, comprasRecentes, vendasRecentes] = await Promise.all([
    prisma.produto.count(),
    prisma.compra.aggregate({ _sum: { valorTotal: true }, _count: true }),
    prisma.venda.aggregate({ _sum: { valorTotal: true }, _count: true }),
    prisma.compra.findMany({ orderBy: { dataCompra: 'desc' }, take: 5, include: { itens: true } }),
    prisma.venda.findMany({ orderBy: { dataVenda: 'desc' }, take: 5, include: { itens: true } }),
  ])

  const valorTotalCompras = Number(totalCompras._sum.valorTotal || 0)
  const valorTotalVendas = Number(totalVendas._sum.valorTotal || 0)
  const lucro = valorTotalVendas - valorTotalCompras

  return {
    totalProdutos,
    totalCompras: totalCompras._count,
    totalVendas: totalVendas._count,
    valorTotalCompras,
    valorTotalVendas,
    lucro,
    comprasRecentes,
    vendasRecentes,
  }
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('pt-BR')
}

export default async function DashboardPage() {
  const dashboard = await getDashboard()

  const cards = [
    { label: 'Produtos Cadastrados', value: dashboard.totalProdutos, color: 'bg-blue-500 dark:bg-blue-600' },
    { label: 'Total de Compras', value: formatCurrency(dashboard.valorTotalCompras), color: 'bg-red-500 dark:bg-red-600' },
    { label: 'Total de Vendas', value: formatCurrency(dashboard.valorTotalVendas), color: 'bg-green-500 dark:bg-green-600' },
    { label: 'Lucro', value: formatCurrency(dashboard.lucro), color: dashboard.lucro >= 0 ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-red-600 dark:bg-red-700' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="card">
            <p className="text-sm text-muted mb-1">{card.label}</p>
            <p className={`text-2xl font-bold text-white px-3 py-1 rounded inline-block ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold dark:text-white">Compras Recentes</h2>
            <Link href="/compras" className="text-sm text-blue-600 hover:underline dark:text-blue-400">Ver todas</Link>
          </div>
          {dashboard.comprasRecentes.length === 0 ? (
            <p className="text-muted text-sm">Nenhuma compra registrada.</p>
          ) : (
            <div className="space-y-3">
              {dashboard.comprasRecentes.map((compra) => (
                <div key={compra.id} className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-sm dark:text-white">{compra.fornecedor}</p>
                    <p className="text-xs text-muted">{formatDate(compra.dataCompra)}</p>
                  </div>
                  <span className="text-red-600 dark:text-red-400 font-semibold text-sm">
                    -{formatCurrency(Number(compra.valorTotal))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold dark:text-white">Vendas Recentes</h2>
            <Link href="/vendas" className="text-sm text-blue-600 hover:underline dark:text-blue-400">Ver todas</Link>
          </div>
          {dashboard.vendasRecentes.length === 0 ? (
            <p className="text-muted text-sm">Nenhuma venda registrada.</p>
          ) : (
            <div className="space-y-3">
              {dashboard.vendasRecentes.map((venda) => (
                <div key={venda.id} className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-sm dark:text-white">{venda.cliente}</p>
                    <p className="text-xs text-muted">{formatDate(venda.dataVenda)}</p>
                  </div>
                  <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                    +{formatCurrency(Number(venda.valorTotal))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
