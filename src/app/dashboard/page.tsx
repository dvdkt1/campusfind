"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { ItemPost } from "@/lib/types";

type MatchSuggestion = {
  item: ItemPost;
  score: number;
  reasons: string[];
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<ItemPost[]>([]);
  const [allItems, setAllItems] = useState<ItemPost[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      setUser(user);

      const { data: ownPosts, error: ownPostsError } = await supabase
        .from("item_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ownPostsError) {
        console.error(ownPostsError);
        setErrorMessage("Could not load your item posts.");
        setItems([]);
      } else {
        setItems((ownPosts ?? []) as ItemPost[]);
      }

      const { data: publicPosts, error: publicPostsError } = await supabase
        .from("item_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (publicPostsError) {
        console.error(publicPostsError);
        setErrorMessage("Could not load match suggestions.");
        setAllItems([]);
      } else {
        setAllItems((publicPosts ?? []) as ItemPost[]);
      }

      setIsLoading(false);
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(error);
      setErrorMessage("Could not log out.");
      return;
    }

    router.push("/login");
    router.refresh();
  }

  async function markAsResolved(itemId: string) {
    setErrorMessage("");
    setActionMessage("");

    if (!user) {
      router.replace("/login");
      return;
    }

    const { error } = await supabase
      .from("item_posts")
      .update({ status: "resolved" })
      .eq("id", itemId)
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      setErrorMessage("Could not mark the item as resolved.");
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, status: "resolved" } : item
      )
    );

    setAllItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, status: "resolved" } : item
      )
    );

    setActionMessage("Item marked as resolved.");
  }

  async function reopenItem(itemId: string) {
    setErrorMessage("");
    setActionMessage("");

    if (!user) {
      router.replace("/login");
      return;
    }

    const { error } = await supabase
      .from("item_posts")
      .update({ status: "open" })
      .eq("id", itemId)
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      setErrorMessage("Could not reopen the item.");
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, status: "open" } : item
      )
    );

    setAllItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, status: "open" } : item
      )
    );

    setActionMessage("Item reopened.");
  }

  function getMatchSuggestions(item: ItemPost): MatchSuggestion[] {
    return allItems
      .filter((possibleMatch) => {
        return (
          possibleMatch.id !== item.id &&
          possibleMatch.type !== item.type &&
          possibleMatch.status === "open" &&
          item.status === "open"
        );
      })
      .map((possibleMatch) => {
        return {
          item: possibleMatch,
          ...calculateMatchScore(item, possibleMatch),
        };
      })
      .filter((match) => match.score >= 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  const lostItems = items.filter((item) => item.type === "lost");
  const foundItems = items.filter((item) => item.type === "found");
  const resolvedItems = items.filter((item) => item.status === "resolved");

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-6xl text-slate-600">
          Loading your dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                CampusFind Dashboard
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                My Item Posts
              </h1>

              <p className="mt-2 text-slate-600">
                Logged in as {user?.email}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/report"
                className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
              >
                Report Item
              </Link>

              <Link
                href="/browse"
                className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
              >
                Browse Listings
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
              >
                Log Out
              </button>
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-4">
          <StatCard label="Total Posts" value={items.length} />
          <StatCard label="Lost Items" value={lostItems.length} />
          <StatCard label="Found Items" value={foundItems.length} />
          <StatCard label="Resolved" value={resolvedItems.length} />
        </section>

        {actionMessage && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            {actionMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {errorMessage}
          </div>
        )}

        {items.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
              No posts yet
            </h2>

            <p className="mt-2 text-slate-600">
              Once you report a lost or found item, it will appear here.
            </p>

            <Link
              href="/report"
              className="mt-5 inline-block rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Report Your First Item
            </Link>
          </section>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const matchSuggestions = getMatchSuggestions(item);

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-slate-100 text-sm text-slate-500">
                      No image uploaded
                    </div>
                  )}

                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                          item.type === "lost"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {item.type}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                          item.status === "resolved"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900">
                      {item.title}
                    </h2>

                    <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                      {item.description}
                    </p>

                    <div className="mt-4 space-y-2 text-sm text-slate-700">
                      <p>
                        <span className="font-semibold">Category:</span>{" "}
                        {item.category}
                      </p>

                      <p>
                        <span className="font-semibold">Location:</span>{" "}
                        {item.location}
                      </p>

                      <p>
                        <span className="font-semibold">Date:</span>{" "}
                        {item.item_date}
                      </p>
                    </div>

                    <section className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="text-sm font-bold text-slate-900">
                        Possible Matches
                      </h3>

                      {item.status === "resolved" ? (
                        <p className="mt-2 text-sm text-slate-500">
                          This item is resolved, so match suggestions are hidden.
                        </p>
                      ) : matchSuggestions.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">
                          No strong matches found yet.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {matchSuggestions.map((match) => (
                            <div
                              key={match.item.id}
                              className="rounded-lg border border-slate-200 bg-white p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold text-slate-900">
                                  {match.item.title}
                                </p>

                                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                                  {match.score}%
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-slate-500">
                                {match.item.type.toUpperCase()} •{" "}
                                {match.item.location} • {match.item.item_date}
                              </p>

                              <p className="mt-2 text-xs text-slate-600">
                                {match.reasons.join(", ")}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    <div className="mt-5">
                      {item.status === "resolved" ? (
                        <button
                          type="button"
                          onClick={() => reopenItem(item.id)}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Reopen Item
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => markAsResolved(item.id)}
                          className="w-full rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
                        >
                          Mark as Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function calculateMatchScore(
  sourceItem: ItemPost,
  possibleMatch: ItemPost
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (
    sourceItem.category.toLowerCase() === possibleMatch.category.toLowerCase()
  ) {
    score += 40;
    reasons.push("same category");
  }

  if (locationsAreSimilar(sourceItem.location, possibleMatch.location)) {
    score += 25;
    reasons.push("similar location");
  }

  const dayDifference = getDayDifference(
    sourceItem.item_date,
    possibleMatch.item_date
  );

  if (dayDifference <= 3) {
    score += 20;
    reasons.push("dates within 3 days");
  } else if (dayDifference <= 7) {
    score += 10;
    reasons.push("dates within 1 week");
  }

  const keywordOverlapCount = getKeywordOverlapCount(sourceItem, possibleMatch);

  if (keywordOverlapCount >= 3) {
    score += 15;
    reasons.push("strong keyword overlap");
  } else if (keywordOverlapCount >= 1) {
    score += 8;
    reasons.push("some keyword overlap");
  }

  return {
    score: Math.min(score, 100),
    reasons,
  };
}

function locationsAreSimilar(locationA: string, locationB: string) {
  const first = normalizeText(locationA);
  const second = normalizeText(locationB);

  return (
    first === second ||
    first.includes(second) ||
    second.includes(first)
  );
}

function getDayDifference(dateA: string, dateB: string) {
  const firstDate = new Date(dateA);
  const secondDate = new Date(dateB);

  const differenceInMs = Math.abs(firstDate.getTime() - secondDate.getTime());

  return Math.floor(differenceInMs / (1000 * 60 * 60 * 24));
}

function getKeywordOverlapCount(itemA: ItemPost, itemB: ItemPost) {
  const itemAKeywords = getKeywords(`${itemA.title} ${itemA.description}`);
  const itemBKeywords = getKeywords(`${itemB.title} ${itemB.description}`);

  let overlapCount = 0;

  for (const keyword of itemAKeywords) {
    if (itemBKeywords.has(keyword)) {
      overlapCount++;
    }
  }

  return overlapCount;
}

function getKeywords(text: string) {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "at",
    "for",
    "from",
    "in",
    "is",
    "it",
    "near",
    "of",
    "on",
    "or",
    "the",
    "this",
    "to",
    "with",
  ]);

  const words = normalizeText(text)
    .split(" ")
    .filter((word) => word.length >= 3 && !stopWords.has(word));

  return new Set(words);
}

function normalizeText(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}