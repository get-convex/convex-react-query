/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  Authenticated,
  AuthLoading,
  ConvexProvider,
  ConvexReactClient,
  Unauthenticated,
} from "convex/react";
import ReactDOM from "react-dom/client";
import {
  ConvexQueryClient,
  convexAction,
  convexQuery,
  useConvexMutation,
} from "./index.js";
import "./index.css";
import { FormEvent, useState } from "react";
import { api } from "../convex/_generated/api.js";
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";

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

function Main() {
  return (
    <ConvexAuthProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>
        <AuthLoading>
          <div>Loading...</div>
        </AuthLoading>
        <Unauthenticated>
          <SignIn />
        </Unauthenticated>
        <Authenticated>
          <App />
        </Authenticated>
        <ReactQueryDevtools initialIsOpen />
      </QueryClientProvider>
    </ConvexAuthProvider>
  );
}

function SignIn() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"signUp" | "signIn">("signIn");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        void signIn("password", formData);
      }}
    >
      <input name="email" placeholder="Email" type="text" />
      <input name="password" placeholder="Password" type="password" />
      <input name="flow" type="hidden" value={step} />
      <button type="submit">{step === "signIn" ? "Sign in" : "Sign up"}</button>
      <button
        type="button"
        onClick={() => {
          setStep(step === "signIn" ? "signUp" : "signIn");
        }}
      >
        {step === "signIn" ? "Sign up instead" : "Sign in instead"}
      </button>
    </form>
  );
}

function Weather() {
  const { data, isPending, error } = useQuery(
    // This query doesn't update reactively, it refetches like a normal queryFn.
    convexAction(api.weather.getSFWeather, {})
  );
  if (isPending || error) return <span>?</span>;
  const fetchedAt = new Date(data.fetchedAt);
  return (
    <div className="weather">
      It is {data.fahrenheit}° F in San Francisco (fetched at{" "}
      {fetchedAt.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      })}
      ).
    </div>
  );
}

function MessageCount() {
  const [shown, setShown] = useState(true);
  // This is a conditional query
  const { data, isPending, error } = useQuery(
    convexQuery(api.messages.count, shown ? {} : "skip")
  );
  return (
    <div className="message-count">
      {isPending
        ? "? messages"
        : error
          ? "error counting messages"
          : `${data} messages`}
      <span onClick={() => setShown(!shown)}>
        {shown
          ? " (click to disable message count)"
          : " (click to enable message count)"}
      </span>
    </div>
  );
}

function App() {
  const { data, error, isPending } = useQuery({
    // This query updates reactively.
    ...convexQuery(api.messages.list, {}),
    initialData: [],
  });

  const [newMessageText, setNewMessageText] = useState("");
  const { mutate, isPending: sending } = useMutation({
    mutationFn: useConvexMutation(api.messages.send),
  });
  const [name] = useState(() => "User " + Math.floor(Math.random() * 10000));
  async function handleSendMessage(event: FormEvent) {
    event.preventDefault();
    if (!sending && newMessageText) {
      mutate(
        { body: newMessageText, author: name },
        {
          onSuccess: () => setNewMessageText(""),
        }
      );
    }
  }
  if (error) {
    return <div>Error: {error.toString()}</div>;
  }
  if (isPending) {
    return <div>loading...</div>;
  }
  return (
    <main>
      <h1>Convex Chat</h1>
      <Weather />
      <MessageCount />
      <p className="badge">
        <span>{name}</span>
      </p>
      <ul>
        {data.map((message) => (
          <li key={message._id}>
            <span>{message.author}:</span>
            <span>{message.body}</span>
            <span>{new Date(message._creationTime).toLocaleTimeString()}</span>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSendMessage}>
        <input
          value={newMessageText}
          onChange={(event) => setNewMessageText(event.target.value)}
          placeholder="Write a message…"
        />
        <input type="submit" value="Send" />
      </form>
    </main>
  );
}

const rootElement = document.getElementById("root")!;
ReactDOM.createRoot(rootElement).render(<Main />);
