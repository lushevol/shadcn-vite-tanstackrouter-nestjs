import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import path from 'node:path'
import { roles, userRoles, users } from './schema'

const databaseFile = path.resolve(__dirname, 'mock.sqlite')

const sqlite = new Database(databaseFile)

sqlite.pragma('foreign_keys = ON')

const statements = [
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" integer PRIMARY KEY AUTOINCREMENT,
    "email" text NOT NULL,
    "password_hash" text NOT NULL,
    "full_name" text NOT NULL,
    "account_number" text NOT NULL,
    "created_at" integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "roles" (
    "id" integer PRIMARY KEY AUTOINCREMENT,
    "name" text NOT NULL,
    "description" text
  )`,
  `CREATE TABLE IF NOT EXISTS "user_roles" (
    "user_id" integer NOT NULL,
    "role_id" integer NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
    PRIMARY KEY ("user_id", "role_id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "users_account_number_idx" ON "users" ("account_number")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "roles_name_idx" ON "roles" ("name")`,
]

for (const statement of statements) {
  sqlite.exec(statement)
}

export const db = drizzle(sqlite, {
  schema: {
    users,
    roles,
    userRoles,
  },
})

export type DatabaseClient = typeof db
