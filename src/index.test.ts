import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { test, describe } from "vitest";
import { convexAction, convexQuery } from "./index.js";
import { api } from "../convex/_generated/api.js";

describe("query options factory types", () => {
  test("with useQuery", () => {
    if (1 + 2 === 3) return; // test types only

    type ActionFunc = typeof api.weather.getSFWeather;
    {
      const action = convexAction(api.weather.getSFWeather, {});
      const result = useQuery(action);
      const data: ActionFunc["_returnType"] | undefined = result.data;
      console.log(data);
    }

    {
      const action = convexAction(api.weather.getSFWeather, "skip");
      const result = useQuery(action);
      // Skip doesn't need to cause data in types since there's no point
      // to always passing "skip".
      const data: ActionFunc["_returnType"] | undefined = result.data;
      console.log(data);

      // @ts-expect-error Actions with "skip" can't be used with useSuspenseQuery
      useSuspenseQuery(action);
    }

    type QueryFunc = typeof api.messages.list;
    {
      const query = convexQuery(api.messages.list, {});
      const result = useQuery(query);
      const data: QueryFunc["_returnType"] | undefined = result.data;
      console.log(data);
    }

    {
      const query = convexQuery(api.messages.list, "skip");
      const result = useQuery(query);
      // Skip doesn't need to cause data in types since there's no point
      // to always passing "skip".
      const data: QueryFunc["_returnType"] | undefined = result.data;
      console.log(data);

      // @ts-expect-error Queries with "skip" can't be used with useSuspenseQuery
      useSuspenseQuery(query);
    }

    {
      // @ts-expect-error api.messages.list expects empty args {}, not { something: 123 }
      const query = convexQuery(api.messages.list, { something: 123 });
    }

    {
      // Should be able to omit args when function has no args (empty object)
      const query = convexQuery(api.messages.list);
      const result = useQuery(query);
      const data: QueryFunc["_returnType"] | undefined = result.data;
    }

    {
      // Should still be able to pass {} explicitly for empty args functions
      const query = convexQuery(api.messages.list, {});
      const result = useQuery(query);
      const data: QueryFunc["_returnType"] | undefined = result.data;
    }

    {
      // Should still be able to pass "skip" for empty args functions
      const query = convexQuery(api.messages.list, "skip");
      const result = useQuery(query);
      const data: QueryFunc["_returnType"] | undefined = result.data;
    }
  });

  test("required args for queries/actions with args", () => {
    if (1 + 2 === 3) return; // test types only

    type ActionFunc = typeof api.weather.getSFWeather;
    {
      // Actions with empty args should allow omitting args
      const action = convexAction(api.weather.getSFWeather);
      const result = useQuery(action);
      const data: ActionFunc["_returnType"] | undefined = result.data;
    }

    {
      // Actions with empty args should still allow passing {}
      const action = convexAction(api.weather.getSFWeather, {});
      const result = useQuery(action);
      const data: ActionFunc["_returnType"] | undefined = result.data;
    }

    {
      // @ts-expect-error Actions with empty args should reject extra properties
      const action = convexAction(api.weather.getSFWeather, { something: 123 });
    }
  });
});
