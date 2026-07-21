"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(error);
      return;
    }

    setUser(null);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <section className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          CampusFind
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          CampusFind
        </h1>

        <p className="mt-4 text-lg text-slate-600">
          A campus lost-and-found platform for reporting, searching, and matching
          lost or found items.
        </p>

        {user && (
          <p className="mt-4 text-sm text-slate-500">
            Logged in as <span className="font-medium">{user.email}</span>
          </p>
        )}

        <nav className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/browse"
            className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-900 hover:bg-white"
          >
            Browse Listings
          </Link>

          {user ? (
            <>
              <Link
                href="/report"
                className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
              >
                Report an Item
              </Link>

              <Link
                href="/dashboard"
                className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-900 hover:bg-white"
              >
                Dashboard
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-900 hover:bg-white"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
              >
                Log In
              </Link>

              <Link
                href="/signup"
                className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-900 hover:bg-white"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </section>

      <section className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
        <FeatureCard
          title="Post lost or found items"
          description="Authenticated users can submit item details such as title, category, location, date, image, and description."
        />

        <FeatureCard
          title="Search campus listings"
          description="Browse public listings and filter by lost/found status, category, location, and keywords."
        />

        <FeatureCard
          title="Manage your posts"
          description="Logged-in users can view their own posts from the dashboard and update item status."
        />
      </section>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}