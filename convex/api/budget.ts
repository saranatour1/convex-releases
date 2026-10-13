import { v } from "convex/values";
import { internalMutation, query } from "../_generated/server";
import { requireUser } from "../lib";

// The AI budget. Gateway calls are billed to this deployment's team, so every
// call that can spend money reserves units here first. A user gets a few, and
// the whole deployment has a hard ceiling. Mutations are transactional, so
// concurrent reservations cannot overshoot.
export const PER_USER_LIMIT = 12;
export const GLOBAL_LIMIT = 300;

export const reserve = internalMutation({
  args: { userId: v.id("users"), units: v.number() },
  returns: v.null(),
  handler: async (ctx, { userId, units }) => {
    const mine = await ctx.db
      .query("aiUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const total = await ctx.db.query("aiTotal").first();

    const usedByUser = (mine?.units ?? 0) + units;
    const usedByAll = (total?.units ?? 0) + units;
    if (usedByUser > PER_USER_LIMIT) {
      throw new Error(`AI budget used up (${PER_USER_LIMIT} calls per visitor).`);
    }
    if (usedByAll > GLOBAL_LIMIT) {
      throw new Error("The shared AI budget is spent. Run this on your own deployment.");
    }

    if (mine) await ctx.db.patch("aiUsage", mine._id, { units: usedByUser });
    else await ctx.db.insert("aiUsage", { userId, units: usedByUser });
    if (total) await ctx.db.patch("aiTotal", total._id, { units: usedByAll });
    else await ctx.db.insert("aiTotal", { units: usedByAll });
    return null;
  },
});

export const status = query({
  args: {},
  returns: v.object({ left: v.number(), limit: v.number() }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const mine = await ctx.db
      .query("aiUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return { left: PER_USER_LIMIT - (mine?.units ?? 0), limit: PER_USER_LIMIT };
  },
});
