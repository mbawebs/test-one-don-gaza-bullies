import { supabase } from "./supabase.js";

const galleryList = document.getElementById("galleryList");
const GALLERY_NAME = "public_gallery";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getSafePhotoUrl(value) {
  const url = String(value ?? "").trim();
  return url.startsWith("http") || url.startsWith("assets/") ? url : "";
}

function normalizePhotoValue(value) {
  if (Array.isArray(value)) {
    return value.map(getSafePhotoUrl).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(getSafePhotoUrl).filter(Boolean);
      }
    } catch {
      return [getSafePhotoUrl(value)].filter(Boolean);
    }
  }

  return [getSafePhotoUrl(value)].filter(Boolean);
}

function getRowPhotos(row) {
  return [
    ...normalizePhotoValue(row.photo_url),
    ...normalizePhotoValue(row.photos),
    ...normalizePhotoValue(row.image_url),
    ...normalizePhotoValue(row.url)
  ];
}

function registerGallery(photos) {
  if (typeof galleries !== "undefined") {
    galleries[GALLERY_NAME] = photos;
  }
}

function renderGalleryCard(photoUrl, index) {
  const safeUrl = escapeHtml(photoUrl);

  return `
    <div class="gallery-card" onclick="openLightbox('${GALLERY_NAME}',${index})">
      <img src="${safeUrl}" alt="Gallery ${index + 1}">
    </div>
  `;
}

async function loadPublicGallery() {
  if (!galleryList) return;

  const { data, error } = await supabase
    .schema("public")
    .from("gallery")
    .select("*")
    .eq("status", "active")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Public gallery error:", error);
    galleryList.innerHTML = "<p>Gallery is unavailable right now.</p>";
    return;
  }

  console.info("Public gallery rows", data);

  const photos = (data || []).flatMap(getRowPhotos);

  console.info("Public gallery normalized photos", photos);

  if (photos.length === 0) {
    galleryList.innerHTML = "<p>No gallery photos available right now.</p>";
    registerGallery([]);
    return;
  }

  registerGallery(photos);
  galleryList.innerHTML = photos.map(renderGalleryCard).join("");
}

loadPublicGallery();
