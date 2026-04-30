(function () {
    var headerTitle = document.getElementById("aboutHeaderTitle");

    if (!headerTitle) {
        return;
    }

    function renderParagraphs(paragraphs) {
        var container = document.getElementById("aboutStoryParagraphs");
        container.innerHTML = (paragraphs || []).map(function (paragraph) {
            return "<p>" + escapeHtml(paragraph) + "</p>";
        }).join("");
    }

    function renderParentsCarousel(images) {
        var track = document.getElementById("aboutParentsCarouselTrack");

        if (!track || !Array.isArray(images) || !images.length) {
            return;
        }

        track.innerHTML = images.map(function (image, index) {
            return '' +
                '<div class="parents-slide' + (index === 0 ? ' is-active' : '') + '">' +
                    '<img src="' + escapeHtml(image.src) + '" alt="' + escapeHtml(image.alt || "Parent or puppy portrait") + '" class="parents-slide-img">' +
                    '<div class="parents-slide-caption">' + escapeHtml(image.caption || "Portrait") + '</div>' +
                '</div>';
        }).join("");
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    fetch("/api/public/about-page")
        .then(function (response) { return response.json(); })
        .then(function (data) {
            if (!data || !data.page) {
                return;
            }

            var page = data.page;
            document.getElementById("aboutHeaderTitle").textContent = page.headerTitle;
            document.getElementById("aboutHeaderSubtitle").textContent = page.headerSubtitle;
            document.getElementById("aboutStoryTitle").textContent = page.storyTitle;
            renderParagraphs(page.storyParagraphs);
            if (page.storyImage) {
                document.getElementById("aboutStoryImage").src = page.storyImage.src;
                document.getElementById("aboutStoryImage").alt = page.storyImage.alt || "Our family with our doodles";
            }
            document.getElementById("aboutParentsSectionTitle").textContent = page.parentsSectionTitle;
            document.getElementById("aboutParentsSectionSubtitle").textContent = page.parentsSectionSubtitle;
            renderParentsCarousel(page.parentsCarouselImages);
            document.getElementById("aboutParentsCardTitle").textContent = page.parentsCardTitle;
            document.getElementById("aboutParentsCardSummary").textContent = page.parentsCardSummary;
            document.getElementById("aboutSadieName").textContent = page.sadieName;
            document.getElementById("aboutSadieDescription").textContent = page.sadieDescription;
            document.getElementById("aboutBroncoName").textContent = page.broncoName;
            document.getElementById("aboutBroncoDescription").textContent = page.broncoDescription;
            document.getElementById("aboutCtaTitle").textContent = page.ctaTitle;
            document.getElementById("aboutCtaBody").textContent = page.ctaBody;
            document.getElementById("aboutCtaPrimary").textContent = page.ctaPrimaryLabel;
            document.getElementById("aboutCtaSecondary").textContent = page.ctaSecondaryLabel;
            document.dispatchEvent(new Event("parents-carousel-updated"));
        })
        .catch(function () {
            // Leave fallback copy in place when the endpoint is unavailable.
        });
}());
