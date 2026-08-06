import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const compra = await prisma.compra.findUnique({
      where: { id: Number(params.id) },
      include: {
        itens: true,
        pagamentos: true,
      },
    })

    if (!compra) {
      return NextResponse.json({ error: 'Compra não encontrada' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.pagamentoCompra.deleteMany({ where: { compraId: compra.id } })
      await tx.itemCompra.deleteMany({ where: { compraId: compra.id } })
      await tx.compra.delete({ where: { id: compra.id } })

      for (const item of compra.itens) {
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { estoque: { decrement: item.quantidade } },
        })
      }
    })

    return NextResponse.json({ message: 'Compra excluída com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir compra' }, { status: 500 })
  }
}
