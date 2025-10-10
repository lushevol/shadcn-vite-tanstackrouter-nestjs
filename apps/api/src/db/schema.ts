import { relations } from 'drizzle-orm'
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    fullName: text('full_name').notNull(),
    accountNumber: text('account_number').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    accountIdx: uniqueIndex('users_account_number_idx').on(table.accountNumber),
  })
)

export const roles = sqliteTable(
  'roles',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    description: text('description'),
  },
  (table) => ({
    nameIdx: uniqueIndex('roles_name_idx').on(table.name),
  })
)

export const userRoles = sqliteTable(
  'user_roles',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
  })
)

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}))

export type User = typeof users.$inferSelect
export type Role = typeof roles.$inferSelect
