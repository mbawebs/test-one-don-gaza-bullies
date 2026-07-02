import { supabase } from "./supabase.js";

const breedingsList = document.getElementById("breedingsList");
const EMPTY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizePhotos(photos) {
  const normalizeList = (items) =>
    items
      .flatMap((photo) => {
        if (typeof photo === "string") return photo;
        if (photo && typeof photo === "object") {
          return photo.url || photo.publicUrl || photo.src || photo.path || "";
        }
        return "";
      })
      .map((photo) => String(photo).trim())
      .filter((photo) => photo.startsWith("http") || photo.startsWith("assets/"));

  if (Array.isArray(photos)) {
    return normalizeList(photos);
  }

  if (typeof photos === "string" && photos.trim()) {
    try {
      const parsed = JSON.parse(photos);
      if (Array.isArray(parsed)) {
        return normalizeList(parsed);
      }

      if (parsed && typeof parsed === "object") {
        return normalizeList([parsed]);
      }
    } catch {
      return normalizeList([photos]);
    }
  }

  return [];
}

function registerGallery(galleryName, photos) {
  if (typeof galleries !== "undefined") {
    galleries[galleryName] = photos;
  }
}

function renderBreedingCard(breeding, index) {
  const photos = normalizePhotos(breeding.photos);
  const hasPhoto = photos.length > 0;
  const galleryId = String(breeding.id ?? index).replace(/[^a-zA-Z0-9_-]/g, "");
  const galleryName = `public_breeding_${galleryId || index}`;
  const title = String(breeding.title ?? "").trim();
  const description = String(breeding.description ?? "").trim();

  registerGallery(galleryName, photos);

  const imageHtml = hasPhoto
    ? `
      <img src="${escapeHtml(photos[0])}" alt="${escapeHtml(title || `Breeding ${index + 1}`)}" onclick="openLightbox('${galleryName}',0)" style="width: 100%; max-height: 860px; object-fit: contain; display: block; background: #050505; cursor: pointer;">`
    : `
      <img src="${EMPTY_IMAGE}" alt="" style="width: 100%; max-height: 860px; object-fit: contain; display: block; background: #050505;">`;
  const titleHtml = title ? `<h3>${escapeHtml(title)}</h3>` : "";
  const descriptionHtml = description ? `<p>${escapeHtml(description)}</p>` : "";
  const contentHtml = titleHtml || descriptionHtml
    ? `
      <div class="card-content">
        ${titleHtml}
        ${descriptionHtml}
      </div>`
    : "";

  return `
    <div style="border: 1px solid rgba(214,173,47,.35); background: linear-gradient(145deg,rgba(0,166,81,.16),rgba(0,0,0,.55)); overflow: hidden; text-align: center;">
      ${imageHtml}
      ${contentHtml}
    </div>
  `;
}

async function loadPublicBreedings() {
  if (!breedingsList) return;

  const { data, error } = await supabase
    .schema("public")
    .from("breedings")
    .select("*")
    .eq("status", "active")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Public breedings error:", error);
    breedingsList.innerHTML = "<p>Breedings are unavailable right now.</p>";
    return;
  }

  if (!data || data.length === 0) {
    breedingsList.innerHTML = "<p>No breedings announced right now.</p>";
    return;
  }

  breedingsList.innerHTML = data.map(renderBreedingCard).join("");
}

loadPublicBreedings();
