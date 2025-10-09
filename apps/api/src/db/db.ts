import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import path from 'node:path'
import { roles, userRoles, users } from './schema'

const databaseFile = path.resolve(__dirname, 'mock.sqlite')

const sqlite = new Database(databaseFile)

export const db = drizzle(sqlite, {
  schema: {
    users,
    roles,
    userRoles,
  },
})

export type DatabaseClient = typeof db
