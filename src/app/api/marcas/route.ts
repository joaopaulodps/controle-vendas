export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const marcas = await prisma.marca.findMany({
      orderBy: { nome: 'asc' },
      take: 200,
    })
    return NextResponse.json(marcas, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar marcas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome } = body

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const existente = await prisma.marca.findFirst({ where: { nome } })
    if (existente) {
      return NextResponse.json({ error: 'Marca já cadastrada' }, { status: 400 })
    }

    const marca = await prisma.marca.create({ data: { nome } })
    return NextResponse.json(marca, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar marca' }, { status: 500 })
  }
}