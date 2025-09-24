import axios from "axios";
import { Router } from "@vaadin/router";
import type { InsertFormData } from "../types/commonTypes";

export const getLtik = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const ltik = searchParams.get("ltik");
  if (!ltik) throw new Error("Missing lti key.");
  return ltik;
};

export async function searchImages(
  query: string,
  page: number,
  count: number,
  token: string
) {
  const res = await axios.get("/api/images", {
    params: { query, pagenumber: page, countperpage: count },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function searchFallbackImages(query: string, token: string) {
  const res = await axios.get("/search-db", {
    params: { query },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export function getStoredImage(): {
  image: any;
  altText: string;
  isDecorative: boolean;
} {
  const fallback = { image: {}, altText: "", isDecorative: false };

  const stored = sessionStorage.getItem("selectedImage");
  if (!stored) return fallback;

  try {
    const image = JSON.parse(stored);
    return {
      image,
      altText: "",
      isDecorative: false,
    };
  } catch (e) {
    console.error("Error parsing selectedImage from sessionStorage:", e);
    return fallback;
  }
}

export function clearStoredImage() {
  sessionStorage.removeItem("selectedImage");
}

export function getStoredSearchTerm(): string {
  return sessionStorage.getItem("searchTerm") || "";
}

export function clearStoredSearchTerm() {
  sessionStorage.removeItem("searchTerm");
}

export function goToSearch(ltik: string) {
  Router.go(`/?ltik=${ltik}`);
}

export function goToDetails(ltik: string) {
  Router.go(`/details?ltik=${ltik}`);
}

export function goToInsert(ltik: string) {
  Router.go(`/insert?ltik=${ltik}`);
}

export async function checkAuthOrRedirect(): Promise<boolean> {
  try {
    const response = await axios.get("/oauth/check");

    const isAuthenticated =
      response.status === 200 && response.data?.authenticated === true;

    if (isAuthenticated) return true;

    const returnTo = `${window.location.pathname}${window.location.search}`;
    setTimeout(() => {
      window.location.href = `/oauth/login?returnTo=${encodeURIComponent(
        returnTo
      )}`;
    }, 500);

    return false;
  } catch (error: any) {
    console.error(
      "Error checking D2L authentication status:",
      error?.message || error
    );

    if (axios.isAxiosError(error) && error.response) {
      console.error("Axios error response status:", error.response.status);
      console.error("Axios error response data:", error.response.data);
    }

    console.error("Falling back to /details redirect...");
    setTimeout(() => {
      window.location.href = "/details";
    }, 500);

    return false;
  }
}

export function flattenObject(obj: any, prefix = ""): { [key: string]: any } {
  const result: { [key: string]: any } = {};
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

export function validateAltText(
  altText: string,
  isDecorative: boolean
): string | null {
  if (!isDecorative && !altText.trim()) {
    return "Please provide alt text or mark image as decorative.";
  }
  return null;
}

export function createInsertForm({
  image,
  altText,
  isDecorative,
  ltik,
}: InsertFormData): HTMLFormElement {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = `/insert?ltik=${ltik}&searchTerm=${encodeURIComponent(
    getStoredSearchTerm()
  )}`;
  form.style.display = "none";

  const flatImageData = flattenObject(image);

  Object.keys(flatImageData).forEach((key) => {
    if (key === "isDecorative" || key === "altText") return;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = flatImageData[key] ?? "";
    form.appendChild(input);
  });

  const altInput = document.createElement("input");
  altInput.type = "hidden";
  altInput.name = "altText";
  altInput.value = altText;
  form.appendChild(altInput);

  const decorativeInput = document.createElement("input");
  decorativeInput.type = "hidden";
  decorativeInput.name = "isDecorative";
  decorativeInput.value = isDecorative ? "true" : "false";
  form.appendChild(decorativeInput);

  return form;
}

export function submitInsertForm(form: HTMLFormElement) {
  document.body.appendChild(form);
  form.submit();
  clearStoredImage();
  clearStoredSearchTerm();
}

export const ALLOWED_QUERY_REGEX = /[\p{L}\p{N}\s\.]+/u

export function sanitizeSearchQuery(raw: string): {
  clean: string;
  changed: boolean;
  invalidChars: string[];
} {
  const input = String(raw ?? "");
  const invalidCharsSet = new Set<string>();
  let clean = "";
  for (const ch of input) {
    if (ALLOWED_QUERY_REGEX.test(ch)) {
      clean += ch;
    } else {
      invalidCharsSet.add(ch);
    }
  }
  clean = clean.replace(/\s+/g, " ").trim();
  return {
    clean,
    changed: clean !== input.trim(),
    invalidChars: Array.from(invalidCharsSet),
  };
}

export function isValidSearchQuery(raw: string): boolean {
  const s = String(raw ?? "").trim();
  if (!s) return false;
  for (const ch of s) {
    if (!ALLOWED_QUERY_REGEX.test(ch)) return false;
  }
  return true;
}

