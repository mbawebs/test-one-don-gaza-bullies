import { supabase } from "./supabase.js";

const EMPTY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatName(value, fallback) {
  return escapeHtml(value || fallback).replace(/\r?\n/g, "<br>");
}

function getSafePhotoUrl(value) {
  const url = String(value ?? "").trim();
  return url.startsWith("http") || url.startsWith("assets/") ? url : "";
}

function normalizePhotoValue(value) {
  const normalizeList = (items) =>
    items
      .flatMap((photo) => {
        if (typeof photo === "string") return photo;
        if (photo && typeof photo === "object") {
          return photo.url || photo.publicUrl || photo.src || photo.path || "";
        }
        return "";
      })
      .map(getSafePhotoUrl)
      .filter(Boolean);

  if (Array.isArray(value)) {
    return normalizeList(value);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? normalizeList(parsed) : normalizeList([parsed]);
    } catch {
      return normalizeList([value]);
    }
  }

  return normalizeList([value]);
}

function getRowPhotos(row) {
  return [
    ...normalizePhotoValue(row.photos),
    ...normalizePhotoValue(row.photo_url),
    ...normalizePhotoValue(row.main_photo_url),
    ...normalizePhotoValue(row.image_url),
    ...normalizePhotoValue(row.url)
  ];
}

function registerGallery(galleryName, photos) {
  if (typeof galleries !== "undefined") {
    galleries[galleryName] = photos;
  }
}

function galleryNameFor(prefix, row, index) {
  const id = String(row.id ?? index).replace(/[^a-zA-Z0-9_-]/g, "");
  return `${prefix}_${id || index}`;
}

function imageBlock(row, index, prefix, alt, contain = false) {
  const photos = getRowPhotos(row);
  const hasPhoto = photos.length > 0;
  const galleryName = galleryNameFor(prefix, row, index);
  const objectFit = contain ? "contain" : "cover";

  registerGallery(galleryName, photos);

  if (!hasPhoto) {
    return `
      <div class="dog-img" style="position: relative;">
        <img src="${EMPTY_IMAGE}" alt="">
        <span class="no-photo" style="display: flex; position: absolute; inset: 15px; align-items: center; justify-content: center; text-align: center; color: #fff; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; pointer-events: none;">No photo available</span>
      </div>`;
  }

  return `
    <div class="dog-img" style="position: relative;" onclick="openLightbox('${galleryName}',0)">
      <img src="${escapeHtml(photos[0])}" alt="${escapeHtml(alt)}" style="object-fit: ${objectFit};" onerror="this.onerror=null; const box=this.parentElement; const hint=box.closest('.dog-card')?.querySelector('.click-hint'); this.src='${EMPTY_IMAGE}'; box.onclick=null; box.querySelector('.no-photo').style.display='flex'; if (typeof galleries !== 'undefined') galleries['${galleryName}']=[]; if(hint) hint.style.display='none';">
      <span class="no-photo" style="display: none; position: absolute; inset: 15px; align-items: center; justify-content: center; text-align: center; color: #fff; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; pointer-events: none;">No photo available</span>
    </div>`;
}

function cardImage(row, index, prefix, alt, contain = false) {
  const photos = getRowPhotos(row);
  const galleryName = galleryNameFor(prefix, row, index);
  const photo = photos[0] || EMPTY_IMAGE;
  const objectFit = contain ? "contain" : "cover";

  registerGallery(galleryName, photos);

  return `<img src="${escapeHtml(photo)}" alt="${escapeHtml(alt)}" onclick="${photos.length ? `openLightbox('${galleryName}',0)` : ""}" style="cursor: ${photos.length ? "pointer" : "default"}; object-fit: ${objectFit}; background: #050505;">`;
}

async function getHomeRows(table) {
  const { data, error } = await supabase
    .schema("public")
    .from(table)
    .select("*")
    .eq("status", "active")
    .eq("show_on_home", true)
    .order("home_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Homepage ${table} error:`, error);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

function details(items) {
  return items.filter(Boolean).join(" &bull; ");
}

function renderDogFeature(row, index, config) {
  const name = formatName(row.name, config.fallbackName);
  const lineage = String(row.lineage ?? "").trim();
  const description = String(row.description ?? "").trim();
  const age = String(row.age ?? "").trim();
  const color = String(row.color ?? "").trim();
  const fee = String(row.stud_fee ?? "").trim();
  const detailText = details([
    age ? `AGE: ${escapeHtml(age)}` : "",
    color ? `COLOR: ${escapeHtml(color.toUpperCase())}` : "",
    fee ? `STUD FEE: ${escapeHtml(fee)}` : ""
  ]);
  const imageHtml = imageBlock(row, index, config.galleryPrefix, row.name || config.fallbackName);
  const detailsHtml = detailText
    ? `<div class="lineage">${detailText}</div>`
    : "";
  const descriptionHtml = description
    ? `<p>${escapeHtml(description)}</p>`
    : "";

  return `
    <div class="dog-card${config.reverse ? " reverse" : ""}">
      ${imageHtml}
      <div class="dog-info">
        <h3>${name}</h3>
        ${lineage ? `<div class="lineage">${escapeHtml(lineage)}</div>` : ""}
        ${detailsHtml}
        ${descriptionHtml}
        ${getRowPhotos(row).length ? '<div class="click-hint">Click image to view full gallery</div>' : ""}
        <br><br>
        <a class="btn gold" href="${config.href}">${config.linkText}</a>
      </div>
    </div>`;
}

function renderProductionCard(row, index) {
  const name = formatName(row.name, `Production ${index + 1}`);
  const description = String(row.description ?? "").trim();

  return `
    <div class="card">
      ${cardImage(row, index, "home_production", row.name || `Production ${index + 1}`)}
      <div class="card-content">
        <h3>${name}</h3>
        ${description ? `<p>${escapeHtml(description)}</p>` : ""}
        <br>
        <a class="btn gold" href="productions.html">View Productions</a>
      </div>
    </div>`;
}

function createSection(id, className, title, subtitle = "") {
  let section = document.getElementById(id);
  if (section) return section;

  section = document.createElement("section");
  section.id = id;
  section.className = className;
  section.hidden = true;
  section.innerHTML = `
    <h2 class="title">${escapeHtml(title)}</h2>
    ${subtitle ? `<p class="sub">${escapeHtml(subtitle)}</p>` : ""}
  `;

  const contact = document.querySelector(".contact");
  document.body.insertBefore(section, contact || document.querySelector("footer"));
  return section;
}

function renderBreedingCard(row, index) {
  const title = String(row.title ?? "").trim();
  const description = String(row.description ?? "").trim();
  const photos = getRowPhotos(row);
  const galleryName = galleryNameFor("home_breeding", row, index);
  const photo = photos[0] || EMPTY_IMAGE;

  registerGallery(galleryName, photos);

  return `
    <div style="border: 1px solid rgba(214,173,47,.35); background: linear-gradient(145deg,rgba(0,166,81,.16),rgba(0,0,0,.55)); overflow: hidden; text-align: center;">
      <img src="${escapeHtml(photo)}" alt="${escapeHtml(title || `Breeding ${index + 1}`)}" onclick="${photos.length ? `openLightbox('${galleryName}',0)` : ""}" style="width: 100%; max-height: 860px; object-fit: contain; display: block; background: #050505; cursor: ${photos.length ? "pointer" : "default"};">
      ${title || description ? `
        <div class="card-content">
          ${title ? `<h3>${escapeHtml(title)}</h3>` : ""}
          ${description ? `<p>${escapeHtml(description)}</p>` : ""}
        </div>` : ""}
    </div>`;
}

function renderAvailableCard(row, index) {
  const name = String(row.name ?? "").trim();
  const description = String(row.description ?? "").trim();
  const gender = String(row.gender ?? "").trim();
  const price = String(row.price ?? "").trim();
  const detailText = details([
    gender ? `GENDER: ${escapeHtml(gender.toUpperCase())}` : "",
    price ? `PRICE: ${escapeHtml(price)}` : ""
  ]);

  return `
    <div class="dog-card">
      ${imageBlock(row, index, "home_available", name || `Available Dog ${index + 1}`)}
      <div class="dog-info">
        ${name ? `<h3>${formatName(name, "")}</h3>` : ""}
        ${detailText ? `<div class="lineage">${detailText}</div>` : ""}
        ${description ? `<p>${escapeHtml(description)}</p>` : ""}
        ${getRowPhotos(row).length ? '<div class="click-hint">Click image to view full gallery</div>' : ""}
      </div>
    </div>`;
}

function renderGalleryCard(photoUrl, index) {
  const galleryName = "home_gallery";
  return `
    <div class="gallery-card" onclick="openLightbox('${galleryName}',${index})">
      <img src="${escapeHtml(photoUrl)}" alt="Gallery highlight ${index + 1}">
    </div>`;
}

async function replaceExistingSection(containerId, table, renderer) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const rows = await getHomeRows(table);
  if (!rows.length) return;

  container.innerHTML = rows.map(renderer).join("");
}

async function renderDynamicSection({ id, className, title, subtitle, table, wrapperClass, renderer, flattenPhotos = false }) {
  const rows = await getHomeRows(table);
  if (!rows.length) return;

  const section = createSection(id, className, title, subtitle);
  const content = document.createElement("div");
  content.className = wrapperClass;

  if (flattenPhotos) {
    const photos = rows.flatMap(getRowPhotos);
    if (!photos.length) return;
    registerGallery("home_gallery", photos);
    content.innerHTML = photos.map(renderGalleryCard).join("");
  } else {
    content.innerHTML = rows.map(renderer).join("");
  }

  section.appendChild(content);
  section.hidden = false;
}

async function loadPublicHome() {
  await Promise.all([
    replaceExistingSection("homeFeaturedStud", "dogs", (row, index) =>
      renderDogFeature(row, index, {
        fallbackName: "Unnamed Stud",
        galleryPrefix: "home_stud",
        href: "studs.html",
        linkText: "View Studs Page"
      })
    ),
    replaceExistingSection("homeFeaturedFemale", "females", (row, index) =>
      renderDogFeature(row, index, {
        fallbackName: "Unnamed Female",
        galleryPrefix: "home_female",
        href: "females.html",
        linkText: "View Females Page",
        reverse: true
      })
    ),
    replaceExistingSection("homeLatestProductions", "productions", renderProductionCard)
  ]);

  await renderDynamicSection({
    id: "homeFeaturedBreedingsSection",
    className: "productions",
    title: "FEATURED BREEDINGS",
    subtitle: "Current and upcoming featured pairings.",
    table: "breedings",
    wrapperClass: "cards",
    renderer: renderBreedingCard
  });

  await renderDynamicSection({
    id: "homeAvailableSection",
    className: "dog-section alt",
    title: "AVAILABLE NOW",
    subtitle: "Featured available dogs from the program.",
    table: "available",
    wrapperClass: "dog-list",
    renderer: renderAvailableCard
  });

  await renderDynamicSection({
    id: "homeGalleryHighlightsSection",
    className: "gallery",
    title: "GALLERY HIGHLIGHTS",
    subtitle: "Featured photos from One Don Gaza Bullies.",
    table: "gallery",
    wrapperClass: "gallery-grid",
    flattenPhotos: true
  });
}

loadPublicHome();
