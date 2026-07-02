import { supabase } from "./supabase.js";

const availableList = document.getElementById("availableList");
const EMPTY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatName(value) {
  return escapeHtml(value || "").replace(/\r?\n/g, "<br>");
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

function getAvailableDetails(item) {
  const details = [];
  const gender = String(item.gender ?? "").trim();
  const price = String(item.price ?? "").trim();

  if (gender) {
    details.push(`GENDER: ${escapeHtml(gender.toUpperCase())}`);
  }

  if (price) {
    details.push(`PRICE: ${escapeHtml(price)}`);
  }

  return details.join(" &bull; ");
}

function registerGallery(galleryName, photos) {
  if (typeof galleries !== "undefined") {
    galleries[galleryName] = photos;
  }
}

function renderAvailableCard(item, index) {
  const photos = normalizePhotos(item.photos);
  const hasPhoto = photos.length > 0;
  const galleryId = String(item.id ?? index).replace(/[^a-zA-Z0-9_-]/g, "");
  const galleryName = `public_available_${galleryId || index}`;
  const name = String(item.name ?? "").trim();
  const description = String(item.description ?? "").trim();
  const details = getAvailableDetails(item);

  registerGallery(galleryName, photos);

  const imageHtml = hasPhoto
    ? `
      <div class="dog-img" style="position: relative;" onclick="openLightbox('${galleryName}',0)">
        <img src="${escapeHtml(photos[0])}" alt="${escapeHtml(name || `Available Dog ${index + 1}`)}" onerror="this.onerror=null; const box=this.parentElement; const hint=box.closest('.dog-card').querySelector('.click-hint'); this.src='${EMPTY_IMAGE}'; box.onclick=null; box.querySelector('.no-photo').style.display='flex'; if (typeof galleries !== 'undefined') galleries['${galleryName}']=[]; if(hint) hint.style.display='none';">
        <span class="no-photo" style="display: none; position: absolute; inset: 15px; align-items: center; justify-content: center; text-align: center; color: #fff; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; pointer-events: none;">No photo available</span>
      </div>`
    : `
      <div class="dog-img" style="position: relative;">
        <img src="${EMPTY_IMAGE}" alt="">
        <span class="no-photo" style="display: flex; position: absolute; inset: 15px; align-items: center; justify-content: center; text-align: center; color: #fff; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; pointer-events: none;">No photo available</span>
      </div>`;
  const nameHtml = name ? `<h3>${formatName(name)}</h3>` : "";
  const detailsHtml = details
    ? `<div class="lineage">${details}</div>`
    : "";
  const descriptionHtml = description
    ? `<p>${escapeHtml(description)}</p>`
    : "";

  return `
    <div class="dog-card">
      ${imageHtml}

      <div class="dog-info">
        ${nameHtml}
        ${detailsHtml}
        ${descriptionHtml}

        <div class="click-hint"${hasPhoto ? "" : " style=\"display: none;\""}>Click image to view full gallery</div>
      </div>
    </div>
  `;
}

async function loadPublicAvailable() {
  if (!availableList) return;

  const { data, error } = await supabase
    .schema("public")
    .from("available")
    .select("*")
    .eq("status", "active")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Public available error:", error);
    availableList.innerHTML = "<p>Available dogs are unavailable right now.</p>";
    return;
  }

  if (!data || data.length === 0) {
    availableList.innerHTML = "<p>No dogs available right now.</p>";
    return;
  }

  availableList.innerHTML = data.map(renderAvailableCard).join("");
}

loadPublicAvailable();
