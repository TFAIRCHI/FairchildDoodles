(function () {
    var grid = document.getElementById("managedGalleryGrid");

    if (!grid) {
        return;
    }

    var loadingState = document.getElementById("galleryLoadingState");
    var emptyState = document.getElementById("galleryEmptyState");
    var headerTitle = document.getElementById("galleryHeaderTitle");
    var headerSubtitle = document.getElementById("galleryHeaderSubtitle");
    var sectionTitle = document.getElementById("gallerySectionTitle");
    var sectionSubtitle = document.getElementById("gallerySectionSubtitle");
    var lightbox = document.createElement("div");
    var lightboxImg;
    var closeBtn;
    var prevBtn;
    var nextBtn;
    var galleryItems = [];
    var currentIndex = 0;

    function toggleState(element, visible) {
        element.classList.toggle("is-hidden", !visible);
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function buildLightbox() {
        lightbox.className = "gallery-lightbox";
        lightbox.innerHTML = '' +
            '<button class="gallery-lightbox-close" type="button" aria-label="Close">×</button>' +
            '<button class="gallery-lightbox-arrow gallery-lightbox-prev" type="button" aria-label="Previous">‹</button>' +
            '<img alt="Gallery image">' +
            '<button class="gallery-lightbox-arrow gallery-lightbox-next" type="button" aria-label="Next">›</button>';
        document.body.appendChild(lightbox);

        lightboxImg = lightbox.querySelector("img");
        closeBtn = lightbox.querySelector(".gallery-lightbox-close");
        prevBtn = lightbox.querySelector(".gallery-lightbox-prev");
        nextBtn = lightbox.querySelector(".gallery-lightbox-next");

        lightbox.addEventListener("click", function (event) {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });

        closeBtn.addEventListener("click", closeLightbox);
        nextBtn.addEventListener("click", showNext);
        prevBtn.addEventListener("click", showPrev);
    }

    function openLightbox(index) {
        currentIndex = index;
        lightboxImg.src = galleryItems[index].src;
        lightboxImg.alt = galleryItems[index].alt || "Gallery image";
        lightbox.classList.add("is-active");
    }

    function closeLightbox() {
        lightbox.classList.remove("is-active");
    }

    function showNext() {
        currentIndex = (currentIndex + 1) % galleryItems.length;
        openLightbox(currentIndex);
    }

    function showPrev() {
        currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
        openLightbox(currentIndex);
    }

    function renderGrid(items) {
        grid.innerHTML = "";
        items.forEach(function (item, index) {
            var card = document.createElement("div");
            card.className = "gallery-item";
            card.innerHTML = '<img src="' + escapeHtml(item.src) + '" alt="' + escapeHtml(item.alt || "Gallery image") + '">';
            card.addEventListener("click", function () {
                openLightbox(index);
            });
            grid.appendChild(card);
        });
    }

    async function loadGallery() {
        toggleState(loadingState, true);
        toggleState(emptyState, false);

        try {
            var response = await fetch("/api/public/gallery-page");
            var data = await response.json();

            if (!response.ok || !data || !data.page) {
                throw new Error("Unable to load the gallery right now.");
            }

            var page = data.page;

            headerTitle.textContent = page.headerTitle || "Puppy Gallery";
            headerSubtitle.textContent = page.headerSubtitle || "";
            sectionTitle.textContent = page.sectionTitle || "Previous Litters";
            sectionSubtitle.textContent = page.sectionSubtitle || "";

            galleryItems = Array.isArray(page.items) ? page.items : [];

            if (!galleryItems.length) {
                grid.innerHTML = "";
                toggleState(emptyState, true);
                return;
            }

            renderGrid(galleryItems);
        } catch (error) {
            emptyState.textContent = error.message || "Unable to load the gallery right now.";
            toggleState(emptyState, true);
        } finally {
            toggleState(loadingState, false);
        }
    }

    buildLightbox();
    loadGallery();
}());
