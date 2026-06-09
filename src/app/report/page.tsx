export default function ReportItemPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Report an Item</h1>
        <p className="mt-2 text-sm text-slate-600">
          Submit a lost or found item report for the campus community.
        </p>

        <form className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Report Type
            </label>
            <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="lost">Lost Item</option>
              <option value="found">Found Item</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Item Title
            </label>
            <input
              type="text"
              placeholder="Example: Black AirPods Case"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Category
            </label>
            <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
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
              type="text"
              placeholder="Example: Library, Beatty Hall, Watson Hall"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Date Lost/Found
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              rows={4}
              placeholder="Describe the item without revealing sensitive ownership details."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Upload Photo
            </label>
            <input
              type="file"
              accept="image/*"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <button
            type="button"
            className="w-full rounded-lg bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-700"
          >
            Submit Report
          </button>
        </form>
      </section>
    </main>
  );
}