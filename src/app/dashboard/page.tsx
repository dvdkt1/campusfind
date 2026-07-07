"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setUser(user);
      setIsLoading(false);
    }

    loadUser();
  }, [router]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

    if (error) {
      console.error(error);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-4xl text-slate-600">
          Checking your account...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              CampusFind Dashboard
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              You are logged in
            </h1>

            <p className="mt-2 text-slate-600">
              Account: {user?.email}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
          >
            Log Out
          </button>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Authentication checkpoint complete
          </h2>

          <p className="mt-2 text-slate-600">
            The next step is connecting item posts and uploaded images to this
            authenticated user.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/report"
              className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
            >
              Report an Item
            </Link>

            <Link
              href="/browse"
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Browse Listings
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}