const galleries = {
  black_rhyno: ["assets/studs/black_rhyno1.png","assets/studs/black_rhyno2.png"],
  diplomat: ["assets/productions/diplomat.png"],
  wizard: ["assets/productions/wizard.png"],
  spice: ["assets/productions/spice.png"],
  mystic: ["assets/females/mystic_01.png"],
  celine: ["assets/females/celine_01.png","assets/females/celine_02.png"],
  gallery: ["assets/gallery/gallery_01.png","assets/gallery/gallery_02.png"]
};
let currentGallery = [];
let currentIndex = 0;
function openLightbox(galleryName, index){
  currentGallery = galleries[galleryName] || [];
  if(!currentGallery.length) return;
  currentIndex = index;
  document.getElementById("lightboxImg").src = currentGallery[currentIndex];
  document.getElementById("lightbox").classList.add("active");
}
function closeLightbox(){document.getElementById("lightbox").classList.remove("active")}
function nextImage(){if(!currentGallery.length) return; currentIndex=(currentIndex+1)%currentGallery.length; document.getElementById("lightboxImg").src=currentGallery[currentIndex]}
function prevImage(){if(!currentGallery.length) return; currentIndex=(currentIndex-1+currentGallery.length)%currentGallery.length; document.getElementById("lightboxImg").src=currentGallery[currentIndex]}
function toggleMenu(){document.body.classList.toggle("menu-open")}
function closeMenu(){document.body.classList.remove("menu-open")}
document.addEventListener("keydown", function(e){
  if(e.key === "Escape"){closeLightbox(); closeMenu();}
  if(e.key === "ArrowRight") nextImage();
  if(e.key === "ArrowLeft") prevImage();
});
document.addEventListener("click", function(e){
  if(e.target && e.target.id === "lightbox") closeLightbox();
  if(e.target && e.target.classList && e.target.classList.contains("menu-overlay")) closeMenu();
});
