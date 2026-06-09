export type ItemType = "lost" | "found";

export type ItemPost = {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  imageUrl?: string;
  status: "open" | "matched" | "resolved";
  createdAt: string;
};