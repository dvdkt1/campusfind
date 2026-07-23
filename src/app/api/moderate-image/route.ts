import { NextResponse } from "next/server";

type ModerationResult = {
  flagged: boolean;
  categories?: Record<string, boolean>;
  category_scores?: Record<string, number>;
};

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { allowed: false, error: "Missing image URL." },
        { status: 400 }
      );
    }

    if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
      return NextResponse.json(
        { allowed: false, error: "Invalid image URL." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { allowed: false, error: "Missing OpenAI API key." },
        { status: 500 }
      );
    }

    const moderationResponse = await fetch(
      "https://api.openai.com/v1/moderations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "omni-moderation-latest",
          input: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        }),
      }
    );

    if (!moderationResponse.ok) {
      const errorText = await moderationResponse.text();

      console.error("OpenAI moderation error:", {
        status: moderationResponse.status,
        statusText: moderationResponse.statusText,
        body: errorText,
      });

      if (moderationResponse.status === 429) {
        return NextResponse.json(
          {
            allowed: false,
            error:
              "Image moderation is temporarily rate-limited. Please wait and try again later.",
          },
          { status: 429 }
        );
      }

      if (moderationResponse.status === 401) {
        return NextResponse.json(
          {
            allowed: false,
            error:
              "Image moderation failed because the OpenAI API key is invalid or unauthorized.",
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          allowed: false,
          error:
            "Image moderation failed. The image was not submitted because it could not be verified.",
        },
        { status: 500 }
      );
    }

    const moderationData = await moderationResponse.json();

    const result = moderationData.results?.[0] as ModerationResult | undefined;

    if (!result) {
      return NextResponse.json(
        {
          allowed: false,
          error:
            "No moderation result was returned. The image was not submitted.",
        },
        { status: 500 }
      );
    }

    const categories = result.categories ?? {};

    const blocked =
      result.flagged ||
      categories.sexual === true ||
      categories["sexual/minors"] === true ||
      categories.violence === true ||
      categories["violence/graphic"] === true ||
      categories["self-harm"] === true ||
      categories["self-harm/intent"] === true ||
      categories["self-harm/instructions"] === true ||
      categories.hate === true ||
      categories["hate/threatening"] === true ||
      categories.harassment === true ||
      categories["harassment/threatening"] === true;

    if (blocked) {
      return NextResponse.json({
        allowed: false,
        flagged: result.flagged,
        categories: result.categories,
        category_scores: result.category_scores,
        error:
          "This image was rejected because it may contain inappropriate or unsafe content.",
      });
    }

    return NextResponse.json({
      allowed: true,
      flagged: result.flagged,
      categories: result.categories,
      category_scores: result.category_scores,
    });
  } catch (error) {
    console.error("Image moderation route error:", error);

    return NextResponse.json(
      {
        allowed: false,
        error:
          "Image moderation failed. The image was not submitted because it could not be verified.",
      },
      { status: 500 }
    );
  }
}