import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../_generated/server";
import { requireUser } from "../lib";

const role = v.union(v.literal("user"), v.literal("assistant"));

// The conversation lives in a table, so it survives a refresh and the phone
// updates live as turns land.
export const list = query({
  args: {},
  returns: v.array(v.object({ _id: v.id("turns"), role, text: v.string() })),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("turns")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(12);
    return rows.reverse().map(({ _id, role, text }) => ({ _id, role, text }));
  },
});

export const clear = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("turns")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(100);
    for (const row of rows) await ctx.db.delete("turns", row._id);
    return null;
  },
});

export const append = internalMutation({
  args: { userId: v.id("users"), role, text: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("turns", args);
    return null;
  },
});

// What the model sees: the last few turns, oldest first.
export const history = internalQuery({
  args: { userId: v.id("users") },
  returns: v.array(v.object({ role, content: v.string() })),
  handler: async (ctx, { userId }) => {
    const rows = await ctx.db
      .query("turns")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(8);
    return rows.reverse().map(({ role, text }) => ({ role, content: text }));
  },
});
