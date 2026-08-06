import { prisma } from '@/lib/prisma'
import { serializeDecimal } from '@/lib/serialize'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const compras = await prisma.compra.findMany({
      orderBy: { dataCompra: 'desc' },
      take: 100,
      include: {
        itens: { include: { produto: { select: { id: true, nome: true } } } },
        pagamentos: true,
      },
    })
    return NextResponse.json(serializeDecimal(compras))
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar compras' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fornecedor, fornecedorId, observacao, itens, pagamentos } = body

    if (!fornecedor || !itens || itens.length === 0) {
      return NextResponse.json({ error: 'Fornecedor e itens são obrigatórios' }, { status: 400 })
    }

    if (!pagamentos || pagamentos.length === 0) {
      return NextResponse.json({ error: 'Forma de pagamento é obrigatória' }, { status: 400 })
    }

    const valorTotal = itens.reduce(
      (sum: number, item: { quantidade: number; precoReal: number }) => sum + item.quantidade * item.precoReal,
      0
    )

    const compra = await prisma.$transaction(async (tx) => {
      const compraCriada = await tx.compra.create({
        data: {
          fornecedor,
          fornecedorId: fornecedorId || null,
          valorTotal,
          observacao,
          itens: {
            create: itens.map((item: { produtoId: number; quantidade: number; precoEstimado: number; precoReal: number }) => ({
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              precoEstimado: item.precoEstimado,
              precoReal: item.precoReal,
            })),
          },
          pagamentos: {
            create: pagamentos.map((pag: { formaPagamento: string; parcela: number; valor: number; dataVencimento: string }) => ({
              formaPagamento: pag.formaPagamento,
              parcela: pag.parcela,
              valor: pag.valor,
              dataVencimento: new Date(pag.dataVencimento),
            })),
          },
        },
        include: { itens: true, pagamentos: true },
      })

      for (const item of itens) {
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { estoque: { increment: item.quantidade } },
        })
      }

      return compraCriada
    })

    return NextResponse.json(serializeDecimal(compra), { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar compra' }, { status: 500 })
  }
}