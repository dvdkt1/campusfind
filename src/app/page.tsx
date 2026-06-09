import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <section className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          CampusFind
        </h1>

        <p className="mt-4 text-lg text-slate-600">
          A campus lost-and-found platform for reporting, searching, and matching
          lost or found items.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/report"
            className="rounded-lg bg-slate-900 px-5 py-3 text-white hover:bg-slate-700"
          >
            Report an Item
          </Link>

          <Link
            href="/browse"
            className="rounded-lg border border-slate-300 px-5 py-3 text-slate-900 hover:bg-white"
          >
            Browse Listings
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
        <FeatureCard
          title="Post lost or found items"
          description="Submit item details such as title, category, location, date, and description."
        />
        <FeatureCard
          title="Search campus listings"
          description="Filter by lost/found status, category, location, and keywords."
        />
        <FeatureCard
          title="Find possible matches"
          description="Match lost and found reports using item details and similarity scoring."
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