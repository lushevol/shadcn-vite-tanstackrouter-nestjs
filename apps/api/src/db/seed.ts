import bcrypt from 'bcrypt'
import { db } from './db'
import { roles, userRoles, users } from './schema'

async function seed() {
  console.log('🪴 Seeding mock authentication database...')

  db.delete(userRoles).run()
  db.delete(users).run()
  db.delete(roles).run()

  const roleRows = [
    { name: 'admin', description: 'Administrator with full access' },
    { name: 'user', description: 'Standard user permissions' },
  ]

  for (const role of roleRows) {
    db.insert(roles).values(role).run()
  }

  const storedRoles = db.select().from(roles).all()

  const adminRole = storedRoles.find((role) => role.name === 'admin')
  const userRole = storedRoles.find((role) => role.name === 'user')

  if (!adminRole || !userRole) {
    throw new Error('Failed to seed roles')
  }

  const password = 'password123'
  const adminPasswordHash = await bcrypt.hash(password, 10)
  const userPasswordHash = await bcrypt.hash(password, 10)

  const insertedUsers = [
    {
      email: 'admin@example.com',
      fullName: 'Demo Admin',
      accountNumber: 'ACC-1001',
      passwordHash: adminPasswordHash,
    },
    {
      email: 'user@example.com',
      fullName: 'Demo User',
      accountNumber: 'ACC-2002',
      passwordHash: userPasswordHash,
    },
  ]

  const inserted = insertedUsers.map((user) =>
    db
      .insert(users)
      .values(user)
      .returning({ id: users.id, email: users.email })
      .get()
  )

  const adminUser = inserted.find((row) => row.email === 'admin@example.com')
  const standardUser = inserted.find((row) => row.email === 'user@example.com')

  if (!adminUser || !standardUser) {
    throw new Error('Failed to insert seed users')
  }

  db.insert(userRoles)
    .values([
      { userId: adminUser.id, roleId: adminRole.id },
      { userId: adminUser.id, roleId: userRole.id },
      { userId: standardUser.id, roleId: userRole.id },
    ])
    .run()

  const seededUsers = db.query.users.findMany({
    with: {
      userRoles: {
        with: {
          role: true,
        },
      },
    },
  })

  console.log('✅ Seeded users:')
  for (const user of seededUsers) {
    const roleNames = user.userRoles.map((userRole) => userRole.role.name)
    console.log(` - ${user.email} [${roleNames.join(', ')}]`)
  }
}

seed()
  .then(() => {
    console.log('🌱 Database seeding complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed to seed database', error)
    process.exit(1)
  })
