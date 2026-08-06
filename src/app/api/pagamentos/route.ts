import { prisma } from '@/lib/prisma'
import { serializeDecimal } from '@/lib/serialize'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filtro = searchParams.get('filtro') || 'todos'

    const whereCompra = filtro === 'pendentes' ? { dataPagamento: null } : filtro === 'pagos' ? { dataPagamento: { not: null } } : {}
    const whereVenda = filtro === 'pendentes' ? { dataPagamento: null } : filtro === 'pagos' ? { dataPagamento: { not: null } } : {}

    const [compras, vendas] = await Promise.all([
      prisma.pagamentoCompra.findMany({
        include: { compra: { select: { id: true, fornecedor: true } } },
        orderBy: { dataVencimento: 'asc' },
        take: 500,
        where: whereCompra,
      }),
      prisma.pagamentoVenda.findMany({
        include: { venda: { select: { id: true, cliente: true } } },
        orderBy: { dataVencimento: 'asc' },
        take: 500,
        where: whereVenda,
      }),
    ])

    const pagamentos = [
      ...compras.map(p => ({
        id: p.id,
        tipo: 'compra' as const,
        referenciaId: p.compraId,
        referenciaNome: p.compra.fornecedor,
        formaPagamento: p.formaPagamento,
        parcela: p.parcela,
        valor: Number(p.valor),
        dataVencimento: p.dataVencimento,
        dataPagamento: p.dataPagamento,
        pago: !!p.dataPagamento,
      })),
      ...vendas.map(p => ({
        id: p.id,
        tipo: 'venda' as const,
        referenciaId: p.vendaId,
        referenciaNome: p.venda.cliente,
        formaPagamento: p.formaPagamento,
        parcela: p.parcela,
        valor: Number(p.valor),
        dataVencimento: p.dataVencimento,
        dataPagamento: p.dataPagamento,
        pago: !!p.dataPagamento,
      })),
    ].sort((a, b) => {
      if (a.pago !== b.pago) return a.pago ? 1 : -1
      return new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime()
    })

    return NextResponse.json(pagamentos)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar pagamentos' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, tipo, dataPagamento } = body

    if (!id || !tipo) {
      return NextResponse.json({ error: 'ID e tipo são obrigatórios' }, { status: 400 })
    }

    const data = dataPagamento ? new Date(dataPagamento) : new Date()

    if (tipo === 'compra') {
      await prisma.pagamentoCompra.update({
        where: { id },
        data: { dataPagamento: data },
      })
    } else if (tipo === 'venda') {
      await prisma.pagamentoVenda.update({
        where: { id },
        data: { dataPagamento: data },
      })
    } else {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar pagamento' }, { status: 500 })
  }
}