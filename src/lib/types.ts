export type ItemType = "lost" | "found";
export type ItemStatus = "open" | "matched" | "resolved";
export type ClaimStatus = "pending" | "approved" | "rejected";

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

export type ClaimRequest = {
  id: string;
  item_id: string;
  requester_id: string;
  owner_id: string;
  message: string;
  status: ClaimStatus;
  created_at: string;
};

export type NotificationRecord = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  related_item_id: string | null;
  related_claim_id: string | null;
  is_read: boolean;
  created_at: string;
};