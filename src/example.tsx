/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ConvexReactClient } from "convex/react";
import { useState } from "react";
import ReactDOM from "react-dom/client";
import { api } from "../convex/_generated/api.js";
import { ConvexQueryClient, convexQuery } from "./index.js";
import "./styles.css";

// Build a global convexClient wherever you would normally create a TanStack Query client.
const convexClient = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
const convexQueryClient = new ConvexQueryClient(convexClient);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The queryKeyHashFn needs to be set globally: it cannot be specified
      // in `setQueryData()`, so the client couldn't update the query results.
      queryKeyHashFn: convexQueryClient.hashFn(),
      // The queryFn is convenient to set globally to avoid needing to import
      // the client everywhere.
      queryFn: convexQueryClient.queryFn(),
    },
  },
});
convexQueryClient.connect(queryClient);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Body />
      <ReactQueryDevtools initialIsOpen />
    </QueryClientProvider>
  );
}

function Body() {
  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      convexClient.mutation(api.repos.star, { repo: "made/up" }),
  });
  const [numComponents, setNumComponents] = useState(1);

  return (
    <div>
      <label htmlFor="number-input">Count: </label>
      <input
        id="number-input"
        type="number"
        value={numComponents}
        onChange={(e) => setNumComponents(parseInt(e.target.value, 10))}
        min="0"
      />
      <br />
      <button onClick={() => mutate()}>Ask a friend to a star</button>
      {isPending ? "***" : ""}
      {[...Array(numComponents).keys()].map((i) => {
        return <Example key={i} />;
      })}
    </div>
  );
}

function Example() {
  const [, setRerender] = useState<any>();
  const forceRerender = () => setRerender({});

  const { isPending, error, data } = useQuery(
    convexQuery(api.repos.get, { repo: "made/up" }),
  );

  if (data) {
    return (
      <div>
        <div>error: {error?.toString() || "none :)"}</div>
        <div>isPending: {isPending}</div>
        <button onClick={forceRerender}>rerender</button>
        <h4>{data.name}</h4>
        <p>{data.description}</p>
        <strong>👀 {data.subscribers_count}</strong>{" "}
        <strong>✨ {data.stargazers_count}</strong>{" "}
        <strong>🍴 {data.forks_count}</strong>
      </div>
    );
  }
}

const rootElement = document.getElementById("root")!;
ReactDOM.createRoot(rootElement).render(<App />);
