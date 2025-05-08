import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  messages: defineTable({
    author: v.string(),
    body: v.string(),
  }),
});
