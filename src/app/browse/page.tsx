import { supabase } from "@/lib/supabaseClient";
import type { ItemPost } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const { data, error } = await supabase
    .from("item_posts")
    .select("*")
    .order("created_at", { ascending: false });

  const items = (data ?? []) as ItemPost[];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Browse Lost & Found Listings
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            View item reports submitted by the campus community.
          </p>
        </div>

        {error && (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Error loading items: {error.message}
          </p>
        )}

        {!error && items.length === 0 && (
          <p className="mt-8 rounded-lg bg-white p-6 text-center text-slate-600">
            No item reports have been submitted yet.
          </p>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase text-slate-700">
                  {item.type}
                </span>

                <span className="text-xs capitalize text-slate-500">
                  {item.status}
                </span>
              </div>

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                {item.title}
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                {item.description}
              </p>

              <div className="mt-4 space-y-1 text-sm text-slate-500">
                <p>Category: {item.category}</p>
                <p>Location: {item.location}</p>
                <p>Date: {item.item_date}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}