(function () {
    var aboutPreviewImage = document.getElementById("homeAboutPreviewImage");
    var homeParentsCarouselTrack = document.getElementById("homeParentsCarouselTrack");

    if (!aboutPreviewImage && !homeParentsCarouselTrack) {
        return;
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function renderParentsCarousel(images) {
        if (!homeParentsCarouselTrack || !Array.isArray(images) || !images.length) {
            return;
        }

        homeParentsCarouselTrack.innerHTML = images.map(function (image, index) {
            return '' +
                '<div class="parents-slide' + (index === 0 ? ' is-active' : '') + '">' +
                    '<img src="' + escapeHtml(image.src) + '" alt="' + escapeHtml(image.alt || "Parent or puppy portrait") + '" class="parents-slide-img">' +
                    '<div class="parents-slide-caption">' + escapeHtml(image.caption || "Portrait") + '</div>' +
                '</div>';
        }).join("");
    }

    fetch("/api/public/home-page")
        .then(function (response) { return response.json(); })
        .then(function (data) {
            if (!data || !data.page) {
                return;
            }

            var page = data.page;

            if (aboutPreviewImage && page.aboutPreviewImage) {
                aboutPreviewImage.src = page.aboutPreviewImage.src;
                aboutPreviewImage.alt = page.aboutPreviewImage.alt || "Our family with our Doodles";
            }

            renderParentsCarousel(page.parentsCarouselImages);
            document.dispatchEvent(new Event("parents-carousel-updated"));
        })
        .catch(function () {
            // Leave fallback media in place when the endpoint is unavailable.
        });
}());
