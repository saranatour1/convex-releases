import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({}),
  aiUsage: defineTable({ userId: v.id('users'), units: v.number() }).index(
    'by_user',
    ['userId'],
  ),
  turns: defineTable({
    userId: v.id('users'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    text: v.string(),
  }).index('by_user', ['userId']),
  aiTotal: defineTable({ units: v.number() }),
})
