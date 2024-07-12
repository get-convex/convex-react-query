import axios from "axios";
import { v } from "convex/values";
import {
  action,
  internalMutation,
  mutation,
  query,
} from "./_generated/server.js";
import { internal } from "./_generated/api.js";

/**
 * GitHub API endpoint for a repo
 */
export const update = action({
  args: { repo: v.optional(v.string()) },
  handler: async (ctx, { repo }) => {
    const defaultRepo = "tannerlinsley/react-query";
    repo = repo || defaultRepo;
    const url = `https://api.github.com/repos/${repo}`;
    console.log(url);
    const allData = await axios.get(url).then((res) => res.data);

    // Dunno what's in there, but we need at least
    // .subscribers_count
    // .stargazers_count
    // .forks_count
    const { subscribers_count, stargazers_count, forks_count } = allData;
    const data = { subscribers_count, stargazers_count, forks_count };

    await ctx.runMutation(internal.repos.save, { data, repo });
  },
});

export const save = internalMutation(
  async (ctx, { repo, data }: { repo: string; data: any }) => {
    const now = Date.now();
    ctx.db.insert("repoData", { data, repo, lastUpdated: now });
  },
);

export const get = query({
  args: { repo: v.string() },
  handler: async (ctx, { repo }) => {
    const result = await ctx.db
      .query("repoData")
      .withIndex("by_last_repo_data")
      .filter((q) => q.eq(q.field("repo"), repo))
      .first();
    if (result === null) throw new Error("oops");
    return { ...result.data, name: repo };
  },
});

export const star = mutation({
  args: { repo: v.string() },
  handler: async (ctx, { repo }) => {
    const result = await ctx.db
      .query("repoData")
      .withIndex("by_last_repo_data")
      .filter((q) => q.eq(q.field("repo"), repo))
      .first();
    if (result === null) throw new Error("oops");
    await ctx.db.replace(result._id, {
      ...result,
      data: {
        ...result.data,
        stargazers_count: result.data.stargazers_count + 1,
      },
    });
  },
});
