import { supabase } from "./supabase.js";

const femalesList = document.getElementById("femalesList");
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
  return escapeHtml(value || "Unnamed Female").replace(/\r?\n/g, "<br>");
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

function getSafeUrl(value) {
  const url = String(value ?? "").trim();
  return url.startsWith("http") || url.startsWith("assets/") ? url : "";
}

function getFemaleDetails(female) {
  const details = [];
  const age = String(female.age ?? "").trim();
  const color = String(female.color ?? "").trim();

  if (age) {
    details.push(`AGE: ${escapeHtml(age)}`);
  }

  if (color) {
    details.push(`COLOR: ${escapeHtml(color.toUpperCase())}`);
  }

  return details.join(" &bull; ");
}

function registerGallery(galleryName, photos) {
  if (typeof galleries !== "undefined") {
    galleries[galleryName] = photos;
  }
}

function renderFemaleCard(female, index) {
  const photos = normalizePhotos(female.photos);
  const hasPhoto = photos.length > 0;
  const galleryId = String(female.id ?? index).replace(/[^a-zA-Z0-9_-]/g, "");
  const galleryName = `public_female_${galleryId || index}`;
  const name = formatName(female.name);
  const imageAlt = escapeHtml(female.name || "Unnamed Female");
  const lineage = String(female.lineage ?? "").trim();
  const details = getFemaleDetails(female);
  const description = escapeHtml(female.description || "");
  const pedigreeUrl = getSafeUrl(female.pedigree_url);

  registerGallery(galleryName, photos);

  const imageHtml = hasPhoto
    ? `
      <div class="dog-img" style="position: relative;" onclick="openLightbox('${galleryName}',0)">
        <img src="${escapeHtml(photos[0])}" alt="${imageAlt}" onerror="this.onerror=null; const box=this.parentElement; const hint=box.closest('.dog-card').querySelector('.click-hint'); this.src='${EMPTY_IMAGE}'; box.onclick=null; box.querySelector('.no-photo').style.display='flex'; if (typeof galleries !== 'undefined') galleries['${galleryName}']=[]; if(hint) hint.style.display='none';">
        <span class="no-photo" style="display: none; position: absolute; inset: 15px; align-items: center; justify-content: center; text-align: center; color: #fff; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; pointer-events: none;">No photo available</span>
      </div>`
    : `
      <div class="dog-img" style="position: relative;">
        <img src="${EMPTY_IMAGE}" alt="">
        <span class="no-photo" style="display: flex; position: absolute; inset: 15px; align-items: center; justify-content: center; text-align: center; color: #fff; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; pointer-events: none;">No photo available</span>
      </div>`;

  const pedigreeHtml = pedigreeUrl
    ? `
        <a class="btn" href="${escapeHtml(pedigreeUrl)}" target="_blank" rel="noopener noreferrer">View Pedigree</a>
        <br><br>`
    : "";
  const lineageHtml = lineage
    ? `
        <div class="lineage">${escapeHtml(lineage)}</div>`
    : "";
  const detailsHtml = details
    ? `
        <div class="stud-details" style="display: block; margin-top: 8px; margin-bottom: 22px; color: var(--gold2); font-size: .78rem; line-height: 1.6; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">${details}</div>`
    : "";

  return `
    <div class="dog-card">
      ${imageHtml}

      <div class="dog-info">
        <h3>${name}</h3>
        ${lineageHtml}
        ${detailsHtml}

        <p>
          ${description}
        </p>

        <div class="click-hint"${hasPhoto ? "" : " style=\"display: none;\""}>Click image to view full gallery</div>

        <br><br>
        ${pedigreeHtml}
        <a class="btn gold" href="contact.html">Contact For Female Info</a>
      </div>
    </div>
  `;
}

async function loadPublicFemales() {
  if (!femalesList) return;

  const { data, error } = await supabase
    .schema("public")
    .from("females")
    .select("*")
    .eq("status", "active")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Public females error:", error);
    femalesList.innerHTML = "<p>Females are unavailable right now.</p>";
    return;
  }

  if (!data || data.length === 0) {
    femalesList.innerHTML = "<p>No females available right now.</p>";
    return;
  }

  femalesList.innerHTML = data.map(renderFemaleCard).join("");
}

loadPublicFemales();
