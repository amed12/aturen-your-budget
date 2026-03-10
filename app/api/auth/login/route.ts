import { comparePassword, setSession, clearSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = loginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return apiError('Invalid username or password', 401)
    }

    const isValid = await comparePassword(password, user.password_hash)

    if (!isValid) {
      return apiError('Invalid username or password', 401)
    }

    await setSession(user.id)

    return apiSuccess({ success: true }, 200)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError((error as any).errors[0].message, 400)
    }
    return apiError('Internal server error', 500)
  }
}

export async function DELETE() {
  await clearSession()
  return apiSuccess({ success: true }, 200)
}
