"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { ItemType } from "@/lib/types";

const categories = [
  "Electronics",
  "ID / Cards",
  "Keys",
  "Clothing",
  "Books",
  "Water Bottle",
  "Bag",
  "Other",
];

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

const imageModerationEnabled =
  process.env.NEXT_PUBLIC_ENABLE_IMAGE_MODERATION === "true";

type UploadedImage = {
  imageUrl: string;
  filePath: string;
};

type ModerationResponse = {
  allowed: boolean;
  flagged?: boolean;
  categories?: Record<string, boolean>;
  error?: string;
};

export default function ReportPage() {
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [type, setType] = useState<ItemType>("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [location, setLocation] = useState("");
  const [itemDate, setItemDate] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function checkAuthentication() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!isActive) {
        return;
      }

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setIsCheckingAuth(false);
    }

    checkAuthentication();

    return () => {
      isActive = false;
    };
  }, [router]);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setErrorMessage("");
    setImageFile(null);

    if (!file) {
      return;
    }

    if (!allowedImageTypes.includes(file.type)) {
      setErrorMessage("Only JPEG, PNG, or WebP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > maxFileSizeBytes) {
      setErrorMessage("Image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setImageFile(file);
  }

  async function uploadImageIfSelected(
    userId: string
  ): Promise<UploadedImage | null> {
    if (!imageFile) {
      return null;
    }

    const fileExtension =
      imageFile.name.split(".").pop()?.toLowerCase() ?? "jpg";

    const filePath = `${userId}/${crypto.randomUUID()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("item-images")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("item-images")
      .getPublicUrl(filePath);

    return {
      imageUrl: data.publicUrl,
      filePath,
    };
  }

  async function removeUploadedImage(filePath: string) {
    const { error } = await supabase.storage
      .from("item-images")
      .remove([filePath]);

    if (error) {
      console.error("Failed to remove uploaded image:", error);
    }
  }

  async function moderateImage(imageUrl: string): Promise<ModerationResponse> {
    const response = await fetch("/api/moderate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ??
          "Image moderation is temporarily unavailable. Please try again later."
      );
    }

    return data as ModerationResponse;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;

    setMessage("");
    setErrorMessage("");
    setIsSubmitting(true);

    let uploadedImage: UploadedImage | null = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      uploadedImage = await uploadImageIfSelected(user.id);

      if (uploadedImage && imageModerationEnabled) {
        try {
          const moderation = await moderateImage(uploadedImage.imageUrl);

          if (!moderation.allowed) {
            await removeUploadedImage(uploadedImage.filePath);

            throw new Error(
              moderation.error ??
                "This image was rejected because it may contain inappropriate or unsafe content."
            );
          }
        } catch (moderationError) {
          await removeUploadedImage(uploadedImage.filePath);

          throw moderationError;
        }
      }

      const { error: insertError } = await supabase.from("item_posts").insert({
        user_id: user.id,
        type,
        title,
        description,
        category,
        location,
        item_date: itemDate,
        image_url: uploadedImage?.imageUrl ?? null,
        status: "open",
      });

      if (insertError) {
        if (uploadedImage) {
          await removeUploadedImage(uploadedImage.filePath);
        }

        throw insertError;
      }

      setMessage("Item report submitted successfully.");
      setType("lost");
      setTitle("");
      setDescription("");
      setCategory("Electronics");
      setLocation("");
      setItemDate("");
      setImageFile(null);

      form.reset();
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting the item."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-3xl text-slate-600">
          Checking your account...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link
  href="/"
  className="text-sm font-semibold uppercase tracking-wide text-blue-700 hover:text-blue-900"
>
  CampusFind
</Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Report an Item
          </h1>
          <p className="mt-2 text-slate-600">
            Submit a lost or found item so it can be stored in the database and
            shown on the Browse Listings page.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Item Type
              </label>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as ItemType)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500"
              >
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                placeholder="Example: Black AirPods case"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500"
              >
                {categories.map((categoryName) => (
                  <option key={categoryName} value={categoryName}>
                    {categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                required
                placeholder="Example: Beatty Hall, Library, Cafeteria"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Date Lost or Found
              </label>
              <input
                type="date"
                value={itemDate}
                onChange={(event) => setItemDate(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                rows={5}
                placeholder="Describe the item clearly. Include color, brand, details, or identifying features."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Image Upload
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500"
              />
              <p className="mt-2 text-sm text-slate-500">
                Allowed: JPEG, PNG, WebP. Maximum size: 5 MB.
              </p>
              {imageModerationEnabled && (
                <p className="mt-1 text-sm text-slate-500">
                  Uploaded images are checked before the report is submitted.
                </p>
              )}
              {imageFile && (
                <p className="mt-2 text-sm text-green-700">
                  Selected image: {imageFile.name}
                </p>
              )}
            </div>

            {message && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
                {message}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? "Submitting..." : "Submit Item Report"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}