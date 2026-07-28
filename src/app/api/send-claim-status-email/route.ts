import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type ClaimRequestEmailData = {
  id: string;
  item_id: string;
  requester_id: string;
  owner_id: string;
  message: string;
  status: "pending" | "approved" | "rejected";
};

type ItemPostEmailData = {
  id: string;
  type: string;
  title: string;
  category: string;
  location: string;
  item_date: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.replace("Bearer ", "").trim();
}

async function getAuthenticatedUser(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function POST(request: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Missing RESEND_API_KEY." },
        { status: 500 }
      );
    }

    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized email request." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const claimId = body?.claimId;

    if (!claimId || typeof claimId !== "string") {
      return NextResponse.json(
        { error: "Missing claimId." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: claimData, error: claimError } = await supabaseAdmin
      .from("claim_requests")
      .select("*")
      .eq("id", claimId)
      .single();

    if (claimError || !claimData) {
      return NextResponse.json(
        { error: "Claim request not found." },
        { status: 404 }
      );
    }

    const claim = claimData as ClaimRequestEmailData;

    if (claim.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Only the item owner can send this status email." },
        { status: 403 }
      );
    }

    if (claim.status !== "approved" && claim.status !== "rejected") {
      return NextResponse.json(
        { error: "Claim is not approved or rejected yet." },
        { status: 400 }
      );
    }

    const { data: itemData, error: itemError } = await supabaseAdmin
      .from("item_posts")
      .select("id, type, title, category, location, item_date")
      .eq("id", claim.item_id)
      .single();

    if (itemError || !itemData) {
      return NextResponse.json(
        { error: "Related item not found." },
        { status: 404 }
      );
    }

    const item = itemData as ItemPostEmailData;

    const { data: requesterData, error: requesterError } =
      await supabaseAdmin.auth.admin.getUserById(claim.requester_id);

    if (requesterError || !requesterData.user?.email) {
      return NextResponse.json(
        { error: "Requester email could not be found." },
        { status: 404 }
      );
    }

    const requesterEmail = requesterData.user.email;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const fromEmail =
      process.env.EMAIL_FROM ?? "CampusFind <onboarding@resend.dev>";

    const resend = new Resend(resendApiKey);

    const statusText =
      claim.status === "approved" ? "accepted as a likely match" : "rejected";

    const subject = `Your CampusFind claim was ${claim.status}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2>Your claim request was ${escapeHtml(statusText)}</h2>

        <p>
          The person who posted the item reviewed your claim request.
        </p>

        <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc;">
          <p><strong>Item:</strong> ${escapeHtml(item.title)}</p>
          <p><strong>Type:</strong> ${escapeHtml(item.type)}</p>
          <p><strong>Category:</strong> ${escapeHtml(item.category)}</p>
          <p><strong>Location:</strong> ${escapeHtml(item.location)}</p>
          <p><strong>Date:</strong> ${escapeHtml(item.item_date)}</p>
          <p><strong>Status:</strong> ${escapeHtml(statusText)}</p>
        </div>

        ${
          claim.status === "approved"
            ? `<p>Please continue through the CampusFind dashboard or coordinate recovery through the appropriate campus process.</p>`
            : `<p>This claim was not accepted. You can continue browsing CampusFind for other matching listings.</p>`
        }

        <p>
          <a href="${appUrl}/dashboard" style="display: inline-block; padding: 10px 16px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">
            Open Dashboard
          </a>
        </p>
      </div>
    `;

    const text = `
Your CampusFind claim was ${statusText}.

Item: ${item.title}
Type: ${item.type}
Category: ${item.category}
Location: ${item.location}
Date: ${item.item_date}

Open your dashboard: ${appUrl}/dashboard
    `.trim();

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [requesterEmail],
      subject,
      html,
      text,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Claim status email error:", error);

    return NextResponse.json(
      { error: "Could not send claim status email." },
      { status: 500 }
    );
  }
}