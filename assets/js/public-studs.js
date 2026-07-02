import { supabase } from "./supabase.js";

const studsList = document.getElementById("studsList");
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
  return escapeHtml(value || "Unnamed Stud").replace(/\r?\n/g, "<br>");
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

function formatStudFee(value) {
  const fee = String(value ?? "").trim();
  if (!fee) return "";

  if (/^\d+(\.\d+)?$/.test(fee)) {
    const amount = Number(fee);
    return `$${amount.toLocaleString("en-US")} USD`;
  }

  return fee;
}

function getDogDetails(dog) {
  const details = [];
  const age = String(dog.age ?? "").trim();
  const color = String(dog.color ?? "").trim();
  const studFee = formatStudFee(dog.stud_fee);

  if (age) {
    details.push(`AGE: ${escapeHtml(age)}`);
  }

  if (color) {
    details.push(`COLOR: ${escapeHtml(color.toUpperCase())}`);
  }

  if (studFee) {
    details.push(`STUD FEE: ${escapeHtml(studFee)}`);
  }

  return details.join(" &bull; ");
}

function registerGallery(galleryName, photos) {
  if (typeof galleries !== "undefined") {
    galleries[galleryName] = photos;
  }
}

function renderDogCard(dog, index) {
  const photos = normalizePhotos(dog.photos);
  const hasPhoto = photos.length > 0;
  const galleryId = String(dog.id ?? index).replace(/[^a-zA-Z0-9_-]/g, "");
  const galleryName = `public_stud_${galleryId || index}`;
  const name = formatName(dog.name);
  const imageAlt = escapeHtml(dog.name || "Unnamed Stud");
  const lineage = String(dog.lineage ?? "").trim();
  const details = getDogDetails(dog);
  const description = escapeHtml(dog.description || "");
  const pedigreeUrl = getSafeUrl(dog.pedigree_url);

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
        <a class="btn gold" href="contact.html">Contact For Stud Info</a>
      </div>
    </div>
  `;
}

async function loadPublicStuds() {
  if (!studsList) return;

  const { data, error } = await supabase
    .schema("public")
    .from("dogs")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Public studs error:", error);
    studsList.innerHTML = "<p>Studs are unavailable right now.</p>";
    return;
  }

  if (!data || data.length === 0) {
    studsList.innerHTML = "<p>No studs available right now.</p>";
    return;
  }

  studsList.innerHTML = data.map(renderDogCard).join("");
}

loadPublicStuds();
