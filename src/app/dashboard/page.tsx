"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { ItemPost } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<ItemPost[]>([]);
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

      const { data, error } = await supabase
        .from("item_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setErrorMessage("Could not load your item posts.");
        setItems([]);
      } else {
        setItems((data ?? []) as ItemPost[]);
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

    setActionMessage("Item reopened.");
  }

  const lostItems = items.filter((item) => item.type === "lost");
  const foundItems = items.filter((item) => item.type === "found");
  const openItems = items.filter((item) => item.status === "open");
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
            {items.map((item) => (
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
            ))}
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