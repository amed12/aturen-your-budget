import { hashPassword, setSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api'
import { z } from 'zod'

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
      return apiError('Username already exists', 400)
    }

    const password_hash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        username,
        password_hash,
      }
    })

    await setSession(user.id)

    return apiSuccess({ success: true, userId: user.id }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError((error as any).errors[0].message, 400)
    }
    return apiError('Internal server error', 500)
  }
}
