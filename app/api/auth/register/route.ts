import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { hashPassword, setSession } from '@/lib/auth'
import { z } from 'zod'

const prisma = new PrismaClient()

const registerSchema = z.object({
  username: z.string().min(3, 'Username minimum 3 characters'),
  password: z.string().min(6, 'Password minimum 6 characters'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    const password_hash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        username,
        password_hash,
      }
    })

    await setSession(user.id)

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
