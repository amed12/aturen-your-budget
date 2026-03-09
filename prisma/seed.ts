import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const defaultCategories = [
    'Makan',
    'Transport',
    'Belanja',
    'Tagihan',
    'Hiburan'
  ]

  console.log('Seeding default categories...')

  for (const name of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name, is_default: true }
    })

    if (!existing) {
      await prisma.category.create({
        data: {
          name,
          is_default: true,
          user_id: null
        }
      })
      console.log(`Created default category: ${name}`)
    } else {
      console.log(`Category already exists: ${name}`)
    }
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
