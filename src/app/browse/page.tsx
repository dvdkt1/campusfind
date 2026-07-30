"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { ItemPost, ItemStatus, ItemType } from "@/lib/types";

const categories = [
  "All",
  "Electronics",
  "ID / Cards",
  "Keys",
  "Clothing",
  "Books",
  "Water Bottle",
  "Bag",
  "Other",
];

export default function BrowsePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<ItemPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [claimingItemId, setClaimingItemId] = useState<string | null>(null);
  const [selectedClaimItem, setSelectedClaimItem] = useState<ItemPost | null>(null);
  const [claimMessage, setClaimMessage] = useState("");

  const [typeFilter, setTypeFilter] = useState<"all" | ItemType>("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | ItemStatus>("all");
  const [locationSearch, setLocationSearch] = useState("");
  const [keywordSearch, setKeywordSearch] = useState("");

  useEffect(() => {
    async function fetchCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    }

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    async function fetchItems() {
      setIsLoading(true);
      setErrorMessage("");

      let query = supabase
        .from("item_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      if (categoryFilter !== "All") {
        query = query.eq("category", categoryFilter);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (locationSearch.trim() !== "") {
        query = query.ilike("location", `%${locationSearch.trim()}%`);
      }

      if (keywordSearch.trim() !== "") {
        const cleanedKeyword = keywordSearch.trim().replace(/[,%()]/g, "");

        query = query.or(
          `title.ilike.%${cleanedKeyword}%,description.ilike.%${cleanedKeyword}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        setErrorMessage("Could not load item listings.");
        setItems([]);
      } else {
        setItems((data ?? []) as ItemPost[]);
      }

      setIsLoading(false);
    }

    fetchItems();
  }, [typeFilter, categoryFilter, statusFilter, locationSearch, keywordSearch]);

  function clearFilters() {
    setTypeFilter("all");
    setCategoryFilter("All");
    setStatusFilter("all");
    setLocationSearch("");
    setKeywordSearch("");
  }

  async function sendClaimEmail(claimId: string) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      return;
    }

    const response = await fetch("/api/send-claim-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ claimId }),
    });

    if (!response.ok) {
      console.warn("Claim email failed:", await response.text());
    }
  } catch (error) {
    console.warn("Claim email failed:", error);
  }
}

  function getDefaultClaimMessage(item: ItemPost) {
  return item.type === "found"
    ? "I think this might be my item. I can provide identifying details to confirm."
    : "I think I found this item. I can provide more details about where I found it.";
}

function openClaimModal(item: ItemPost) {
  setErrorMessage("");
  setActionMessage("");

  if (!user) {
    router.push("/login");
    return;
  }

  if (!item.user_id) {
    setErrorMessage(
      "This listing cannot receive claim requests because it is not linked to an owner."
    );
    return;
  }

  if (item.user_id === user.id) {
    setErrorMessage("You cannot create a claim request for your own post.");
    return;
  }

  setSelectedClaimItem(item);
  setClaimMessage(getDefaultClaimMessage(item));
}

function closeClaimModal() {
  if (claimingItemId) {
    return;
  }

  setSelectedClaimItem(null);
  setClaimMessage("");
}

  async function submitClaimRequest(item: ItemPost) {
  setErrorMessage("");
  setActionMessage("");

  if (!user) {
    router.push("/login");
    return;
  }

  if (!item.user_id) {
    setErrorMessage(
      "This listing cannot receive claim requests because it is not linked to an owner."
    );
    return;
  }

  if (item.user_id === user.id) {
    setErrorMessage("You cannot create a claim request for your own post.");
    return;
  }

  const cleanedMessage = claimMessage.trim();

  if (cleanedMessage.length < 10) {
    setErrorMessage("Please enter a claim message with at least 10 characters.");
    return;
  }

  setClaimingItemId(item.id);

  try {
    const { data: claim, error: claimError } = await supabase
      .from("claim_requests")
      .insert({
        item_id: item.id,
        requester_id: user.id,
        owner_id: item.user_id,
        message: cleanedMessage,
        status: "pending",
      })
      .select("id")
      .single();

    if (claimError) {
      throw claimError;
    }

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: item.user_id,
        title: "New claim request",
        message: `${
          user.email ?? "A user"
        } submitted a claim request for your listing: ${item.title}.`,
        related_item_id: item.id,
        related_claim_id: claim.id,
        is_read: false,
      });

    if (notificationError) {
      throw notificationError;
    }

    if (process.env.NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS === "true") {
      await sendClaimEmail(claim.id);
    }

    setSelectedClaimItem(null);
    setClaimMessage("");

    setActionMessage(
      "Claim request sent. The person who posted this item will see it in their dashboard."
    );
  } catch (error) {
    console.error(error);
    setErrorMessage("Could not send the claim request.");
  } finally {
    setClaimingItemId(null);
  }
}

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
  href="/"
  className="text-sm font-semibold uppercase tracking-wide text-blue-700 hover:text-blue-900"
>
  CampusFind
</Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Browse Listings
          </h1>
          <p className="mt-2 text-slate-600">
            Search and filter database-backed lost and found item reports.
          </p>
        </div>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as "all" | ItemType)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              >
                <option value="all">All</option>
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              >
                {categories.map((categoryName) => (
                  <option key={categoryName} value={categoryName}>
                    {categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | ItemStatus)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="matched">Matched</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                value={locationSearch}
                onChange={(event) => setLocationSearch(event.target.value)}
                placeholder="Library, Beatty..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Keyword
              </label>
              <input
                value={keywordSearch}
                onChange={(event) => setKeywordSearch(event.target.value)}
                placeholder="AirPods, wallet..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {items.length} result{items.length === 1 ? "" : "s"}.
            </p>

            <button
              onClick={clearFilters}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Clear Filters
            </button>
          </div>
        </section>

        {actionMessage && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            {actionMessage}
          </div>
        )}

        {isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
            Loading listings...
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {errorMessage}
          </div>
        )}

        {!isLoading && !errorMessage && items.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
            No listings match the current filters.
          </div>
        )}

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const canClaim =
              item.status === "open" && item.user_id && item.user_id !== user?.id;

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

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {item.status}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900">
                    {item.title}
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
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
                    {!user ? (
                      <button
                        type="button"
                        onClick={() => router.push("/login")}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Log in to request recovery
                      </button>
                    ) : canClaim ? (
                      <button
                        type="button"
                        onClick={() => openClaimModal(item)}
                        disabled={claimingItemId === item.id}
                        className="w-full rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {claimingItemId === item.id
                          ? "Sending..."
                          : item.type === "found"
                            ? "This might be mine"
                            : "I found this item"}
                      </button>
                    ) : item.user_id === user.id ? (
                      <p className="rounded-lg bg-slate-50 px-4 py-2 text-center text-sm text-slate-500">
                        This is your post.
                      </p>
                    ) : (
                      <p className="rounded-lg bg-slate-50 px-4 py-2 text-center text-sm text-slate-500">
                        Claim requests are unavailable for this listing.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
        {selectedClaimItem && (
  <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 px-4 py-6">
  <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
      {selectedClaimItem.image_url ? (
        <img
          src={selectedClaimItem.image_url}
          alt={selectedClaimItem.title}
          className="h-40 w-full object-cover sm:h-56"
        />
      ) : (
        <div className="flex h-56 w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
          No image uploaded for this listing
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Claim Request
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {selectedClaimItem.type === "found"
                ? "Is this your item?"
                : "Did you find this item?"}
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Send a message to the person who posted this listing. Include
              details that help prove the item matches.
            </p>
          </div>

          <button
            type="button"
            onClick={closeClaimModal}
            disabled={claimingItemId === selectedClaimItem.id}
            className="rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                selectedClaimItem.type === "lost"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {selectedClaimItem.type}
            </span>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
              {selectedClaimItem.status}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900">
            {selectedClaimItem.title}
          </h3>

          <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <p>
              <span className="font-semibold">Category:</span>{" "}
              {selectedClaimItem.category}
            </p>

            <p>
              <span className="font-semibold">Location:</span>{" "}
              {selectedClaimItem.location}
            </p>

            <p>
              <span className="font-semibold">Date:</span>{" "}
              {selectedClaimItem.item_date}
            </p>

            <p>
              <span className="font-semibold">Post ID:</span>{" "}
              {getShortId(selectedClaimItem.id)}
            </p>
          </div>

          <p className="mt-3 line-clamp-3 text-sm text-slate-600">
            {selectedClaimItem.description}
          </p>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Your claim message
          </label>

          <textarea
            value={claimMessage}
            onChange={(event) => setClaimMessage(event.target.value)}
            rows={5}
            placeholder="Example: I lost black AirPods near the library. The case has a small scratch on the front and my initials are inside."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />

          <p className="mt-2 text-sm text-slate-500">
            Include details such as color, brand, scratches, stickers,
            initials, contents, exact location, or time lost/found.
          </p>
        </div>

        <div className="sticky bottom-0 -mx-6 mt-6 flex flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeClaimModal}
            disabled={claimingItemId === selectedClaimItem.id}
            className="rounded-lg border border-slate-300 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => submitClaimRequest(selectedClaimItem)}
            disabled={
              claimingItemId === selectedClaimItem.id ||
              claimMessage.trim().length < 10
            }
            className="rounded-lg bg-blue-700 px-5 py-2 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {claimingItemId === selectedClaimItem.id
              ? "Sending claim..."
              : "Submit Claim Request"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      </div>
    </main>
  );
}
function getShortId(id: string) {
  return `...${id.slice(-6)}`;
}