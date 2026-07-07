export type ItemType = "lost" | "found";
export type ItemStatus = "open" | "matched" | "resolved";

export type ItemPost = {
  id: string;
  user_id: string | null;
  type: ItemType;
  title: string;
  description: string;
  category: string;
  location: string;
  item_date: string;
  status: ItemStatus;
  image_url?: string | null;
  created_at: string;
};