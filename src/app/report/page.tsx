"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ReportItemPage() {
  const [type, setType] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [location, setLocation] = useState("");
  const [itemDate, setItemDate] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Submitting report...");

    const { error } = await supabase.from("item_posts").insert({
      type,
      title,
      category,
      location,
      item_date: itemDate,
      description,
      status: "open",
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    setTitle("");
    setCategory("Electronics");
    setLocation("");
    setItemDate("");
    setDescription("");
    setType("lost");
    setMessage("Item report submitted successfully.");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Report an Item</h1>
        <p className="mt-2 text-sm text-slate-600">
          Submit a lost or found item report for the campus community.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Report Type
            </label>
            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value as "lost" | "found")
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="lost">Lost Item</option>
              <option value="found">Found Item</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Item Title
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              type="text"
              required
              placeholder="Example: Black AirPods Case"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Category
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option>Electronics</option>
              <option>School Supplies</option>
              <option>Clothing</option>
              <option>Keys/ID</option>
              <option>Personal Item</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Campus Location
            </label>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              type="text"
              required
              placeholder="Example: Library, Beatty Hall, Watson Hall"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Date Lost/Found
            </label>
            <input
              value={itemDate}
              onChange={(event) => setItemDate(event.target.value)}
              type="date"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              required
              placeholder="Describe the item without revealing sensitive ownership details."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-700"
          >
            Submit Report
          </button>

          {message && (
            <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
              {message}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}