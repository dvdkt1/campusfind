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
};

type ItemPostEmailData = {
  id: string;
  type: string;
  title: string;
  description: string;
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

    if (claim.requester_id !== user.id) {
      return NextResponse.json(
        { error: "You can only send email for your own claim request." },
        { status: 403 }
      );
    }

    const { data: itemData, error: itemError } = await supabaseAdmin
      .from("item_posts")
      .select("id, type, title, description, category, location, item_date")
      .eq("id", claim.item_id)
      .single();

    if (itemError || !itemData) {
      return NextResponse.json(
        { error: "Related item not found." },
        { status: 404 }
      );
    }

    const item = itemData as ItemPostEmailData;

    const { data: ownerData, error: ownerError } =
      await supabaseAdmin.auth.admin.getUserById(claim.owner_id);

    if (ownerError || !ownerData.user?.email) {
      return NextResponse.json(
        { error: "Owner email could not be found." },
        { status: 404 }
      );
    }

    const ownerEmail = ownerData.user.email;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const fromEmail =
      process.env.EMAIL_FROM ?? "CampusFind <onboarding@resend.dev>";

    const resend = new Resend(resendApiKey);

    const subject = `New CampusFind claim request: ${item.title}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2>New claim request</h2>

        <p>
          A CampusFind user submitted a claim request for one of your listings.
        </p>

        <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc;">
          <p><strong>Item:</strong> ${escapeHtml(item.title)}</p>
          <p><strong>Type:</strong> ${escapeHtml(item.type)}</p>
          <p><strong>Category:</strong> ${escapeHtml(item.category)}</p>
          <p><strong>Location:</strong> ${escapeHtml(item.location)}</p>
          <p><strong>Date:</strong> ${escapeHtml(item.item_date)}</p>
        </div>

        <h3>Claim message</h3>
        <p style="white-space: pre-wrap; padding: 12px; border-left: 4px solid #2563eb; background: #eff6ff;">
          ${escapeHtml(claim.message)}
        </p>

        <p>
          Review this request in your CampusFind dashboard and accept or reject it based on identifying details.
        </p>

        <p>
          <a href="${appUrl}/dashboard" style="display: inline-block; padding: 10px 16px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">
            Open Dashboard
          </a>
        </p>
      </div>
    `;

    const text = `
New CampusFind claim request

Item: ${item.title}
Type: ${item.type}
Category: ${item.category}
Location: ${item.location}
Date: ${item.item_date}

Claim message:
${claim.message}

Open your dashboard: ${appUrl}/dashboard
    `.trim();

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [ownerEmail],
      subject,
      html,
      text,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Claim email error:", error);

    return NextResponse.json(
      { error: "Could not send claim email." },
      { status: 500 }
    );
  }
}