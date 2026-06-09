import { mockItems } from "@/lib/mockItems";

export default function BrowsePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Browse Lost & Found Listings
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Search and filter campus item reports.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search by keyword..."
            className="rounded-lg border border-slate-300 px-3 py-2 md:w-80"
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <select className="rounded-lg border border-slate-300 px-3 py-2">
            <option>All Types</option>
            <option>Lost</option>
            <option>Found</option>
          </select>

          <select className="rounded-lg border border-slate-300 px-3 py-2">
            <option>All Categories</option>
            <option>Electronics</option>
            <option>School Supplies</option>
            <option>Clothing</option>
            <option>Keys/ID</option>
            <option>Personal Item</option>
          </select>

          <input
            type="text"
            placeholder="Location"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />

          <input
            type="date"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockItems.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase text-slate-700">
                  {item.type}
                </span>

                <span className="text-xs text-slate-500">{item.status}</span>
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
                <p>Date: {item.date}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}