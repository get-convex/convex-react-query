import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  repoData: defineTable({
    repo: v.string(),
    data: v.object({
      subscribers_count: v.number(),
      stargazers_count: v.number(),
      forks_count: v.number(),
      name: v.string(),
      description: v.string(),
    }),
    lastUpdated: v.number(),
  }).index("by_last_repo_data", ["repo", "lastUpdated"]),
});
