(function () {
    var grid = document.getElementById("puppiesGrid");

    if (!grid) {
        return;
    }

    var loadingState = document.getElementById("puppiesLoadingState");
    var emptyState = document.getElementById("puppiesEmptyState");
    var bannerSection = document.getElementById("puppiesBannerSection");
    var bannerText = document.getElementById("puppiesBannerText");
    var headerTitle = document.getElementById("puppiesHeaderTitle");
    var headerSubtitle = document.getElementById("puppiesHeaderSubtitle");
    var infoLabel = document.getElementById("puppiesInfoLabel");
    var infoTitle = document.getElementById("puppiesInfoTitle");
    var infoBody = document.getElementById("puppiesInfoBody");
    var ctaTitle = document.getElementById("puppiesCtaTitle");
    var ctaBody = document.getElementById("puppiesCtaBody");
    var ctaButton = document.getElementById("puppiesCtaButton");

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatPrice(value) {
        if (value == null || value === "") {
            return "Pricing on request";
        }

        return "$" + Number(value).toLocaleString();
    }

    function formatGender(value) {
        if (!value) {
            return "Puppy";
        }

        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    function badgeMarkup(status) {
        var normalized = (status || "available").toLowerCase();

        if (normalized === "sold") {
            return '<div class="puppy-card-sold-banner" aria-label="Sold puppy banner">SOLD!</div>';
        }

        if (normalized === "reserved") {
            return '<div class="puppy-card-sold-banner" aria-label="Reserved puppy banner">RESERVED</div>';
        }

        return '<div class="puppy-card-available-banner" aria-label="Available puppy banner">AVAILABLE!</div>';
    }

    function carouselClass(status) {
        return status === "sold" || status === "reserved" ? "puppy-card-carousel puppy-card-carousel--sold" : "puppy-card-carousel";
    }

    function placeholderImage(puppy) {
        return {
            src: "logo.png",
            alt: puppy.displayName + " photo placeholder",
            weekLabel: "Photo Coming Soon"
        };
    }

    function uniqueWeekLabels(images) {
        var labels = [];

        images.forEach(function (image) {
            if (image.weekLabel && labels.indexOf(image.weekLabel) === -1) {
                labels.push(image.weekLabel);
            }
        });

        return labels;
    }

    function renderPuppyCard(puppy, index) {
        var images = Array.isArray(puppy.images) && puppy.images.length ? puppy.images : [placeholderImage(puppy)];
        var weekLabels = uniqueWeekLabels(images);
        var slides = images.map(function (image, imageIndex) {
            var isFirst = imageIndex === 0;
            var srcAttr = isFirst ? 'src="' + escapeHtml(image.src) + '"' : 'data-src="' + escapeHtml(image.src) + '" loading="lazy"';
            var fetchPriority = index < 2 && isFirst ? ' fetchpriority="high"' : "";

            return '' +
                '<figure class="puppy-card-slide' + (isFirst ? ' is-active' : '') + '" data-week="' + escapeHtml(image.weekLabel || "Photos") + '">' +
                    '<img ' + srcAttr + ' alt="' + escapeHtml(image.alt || (puppy.displayName + ' photo')) + '" decoding="async"' + fetchPriority + '>' +
                '</figure>';
        }).join("");

        var tags = weekLabels.map(function (label) {
            return '<button class="puppy-week-jump" type="button" data-week="' + escapeHtml(label) + '">' + escapeHtml(label) + '</button>';
        });

        if (puppy.litterBirthDateLabel) {
            tags.push('<span>Born ' + escapeHtml(puppy.litterBirthDateLabel) + '</span>');
        }

        if (puppy.colorLabel) {
            tags.push('<span>' + escapeHtml(puppy.colorLabel) + '</span>');
        }

        var description = puppy.shortSummary || puppy.longDescription || "";
        var meta = formatGender(puppy.gender) + " • " + formatPrice(puppy.price);

        return '' +
            '<article class="puppy-baseball-card fade-in">' +
                '<div class="' + carouselClass(puppy.availabilityStatus) + '" data-interval="5000">' +
                    badgeMarkup(puppy.availabilityStatus) +
                    '<div class="puppy-card-slides">' + slides + '</div>' +
                    '<button class="puppy-card-arrow puppy-card-prev" type="button" aria-label="Previous photo">‹</button>' +
                    '<button class="puppy-card-arrow puppy-card-next" type="button" aria-label="Next photo">›</button>' +
                    '<div class="puppy-card-dots"></div>' +
                '</div>' +
                '<div class="puppy-card-body">' +
                    '<h3>' + escapeHtml(puppy.displayName) + '</h3>' +
                    '<p class="puppy-card-meta">' + escapeHtml(meta) + '</p>' +
                    (description ? '<p class="admin-panel__intro">' + escapeHtml(description) + '</p>' : '') +
                    '<div class="puppy-card-tags">' + tags.join("") + '</div>' +
                '</div>' +
            '</article>';
    }

    function rerunInteractions() {
        if (typeof IntersectionObserver !== "undefined") {
            document.querySelectorAll(".fade-in").forEach(function (el) {
                if (!el.classList.contains("visible")) {
                    el.classList.add("visible");
                }
            });
        }

        var event = new Event("puppies-page-rendered");
        document.dispatchEvent(event);
    }

    function toggleState(element, visible) {
        element.classList.toggle("is-hidden", !visible);
    }

    async function loadPage() {
        toggleState(loadingState, true);
        toggleState(emptyState, false);

        try {
            var response = await fetch("/api/public/puppies-page");
            var data = await response.json();

            if (!response.ok || !data || !data.page) {
                throw new Error("Unable to load the current puppies page.");
            }

            var page = data.page;

            headerTitle.textContent = page.headerTitle || "Available Puppies";
            headerSubtitle.textContent = page.headerSubtitle || "";
            infoLabel.textContent = page.infoLabel || "Current Litter";
            infoTitle.textContent = page.infoTitle || "Meet the Puppies";
            infoBody.textContent = page.infoBody || "";
            ctaTitle.textContent = page.ctaTitle || "Questions about this litter?";
            ctaBody.textContent = page.ctaBody || "";
            ctaButton.textContent = page.ctaButtonLabel || "CONTACT US";

            if (page.bannerText) {
                bannerText.textContent = page.bannerText;
                toggleState(bannerSection, true);
            } else {
                toggleState(bannerSection, false);
            }

            if (!Array.isArray(page.puppies) || !page.puppies.length) {
                grid.innerHTML = "";
                toggleState(emptyState, true);
                return;
            }

            grid.innerHTML = page.puppies.map(renderPuppyCard).join("");
            rerunInteractions();
        } catch (error) {
            grid.innerHTML = "";
            emptyState.textContent = error.message || "Unable to load puppies right now.";
            toggleState(emptyState, true);
        } finally {
            toggleState(loadingState, false);
        }
    }

    loadPage();
}());
