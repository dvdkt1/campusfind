import type { ItemPost } from "./types";

export const mockItems: ItemPost[] = [
  {
    id: "1",
    type: "lost",
    title: "Black AirPods Case",
    description: "Lost near the library. The case has a small scratch on the front.",
    category: "Electronics",
    location: "Library",
    date: "2026-06-01",
    status: "open",
    createdAt: "2026-06-01T10:00:00Z",
  },
  {
    id: "2",
    type: "found",
    title: "Water Bottle",
    description: "Blue water bottle found in a classroom.",
    category: "Personal Item",
    location: "Beatty Hall",
    date: "2026-06-01",
    status: "open",
    createdAt: "2026-06-01T11:00:00Z",
  },
];