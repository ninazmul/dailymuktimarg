import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import qs from "query-string";
import { UrlQueryParams, RemoveUrlQueryParams } from "@/types";

// ===== Tailwind CSS class merger =====
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ===== Date formatting =====
export const formatDateTime = (dateString: Date | string) => {
  const date = new Date(dateString);

  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZone: "Asia/Dhaka",
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    year: "numeric",
    day: "numeric",
    timeZone: "Asia/Dhaka",
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZone: "Asia/Dhaka",
  };

  return {
    dateTime: date.toLocaleString("en-US", dateTimeOptions),
    dateOnly: date.toLocaleString("en-US", dateOptions),
    timeOnly: date.toLocaleString("en-US", timeOptions),
  };
};

// ===== Slug generation =====
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ===== URL query helpers =====
export function formUrlQuery({ params, key, value }: UrlQueryParams) {
  const currentUrl = qs.parse(params);
  currentUrl[key] = value;

  return qs.stringifyUrl(
    { url: window.location.pathname, query: currentUrl },
    { skipNull: true },
  );
}

export function removeKeysFromQuery({
  params,
  keysToRemove,
}: RemoveUrlQueryParams) {
  const currentUrl = qs.parse(params);
  keysToRemove.forEach((key) => delete currentUrl[key]);

  return qs.stringifyUrl(
    { url: window.location.pathname, query: currentUrl },
    { skipNull: true },
  );
}

// ===== File helpers =====
export const convertFileToUrl = (file: File) => URL.createObjectURL(file);

// ===== Error handler =====
export const handleError = (error: unknown) => {
  console.error(error);
  throw new Error(typeof error === "string" ? error : JSON.stringify(error));
};

// ===== Truncate text =====
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

// ===== Format number for display (e.g. 1.2K, 3.4M) =====
export function formatCount(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

// ===== Safe JSON parse for lean() results =====
export function safeJson<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// ===== Video URL Embed Helper =====
export function getVideoEmbedUrl(videoUrl?: string): string | null {
  if (!videoUrl) return null;
  const trimmed = videoUrl.trim();
  if (!trimmed) return null;

  // 1. Extract src if user pasted an iframe HTML tag
  if (trimmed.includes("<iframe") && trimmed.includes("src=")) {
    const match = trimmed.match(/src=["']([^"']+)["']/);
    if (match && match[1]) return match[1];
  }

  // 2. Standard YouTube URL patterns
  // Matches:
  // - youtube.com/watch?v=ID
  // - youtube.com/watch?.+&v=ID
  // - youtube.com/embed/ID
  // - youtube.com/v/ID
  // - youtube.com/shorts/ID
  // - youtu.be/ID
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // 3. Vimeo URL pattern
  const vimeoMatch = trimmed.match(
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/i
  );
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // 4. Raw 11-character YouTube video ID
  if (/^[\w-]{11}$/.test(trimmed)) {
    return `https://www.youtube.com/embed/${trimmed}`;
  }

  // 5. Fallback for valid HTTP/HTTPS URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.includes("watch?v=")) {
      const videoId = trimmed.split("watch?v=")[1]?.split("&")[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    return trimmed;
  }

  return null;
}