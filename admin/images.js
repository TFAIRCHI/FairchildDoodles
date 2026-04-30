(function () {
    var authSummary = document.getElementById("imageAuthSummary");
    var loginButton = document.getElementById("imageLoginButton");
    var logoutButton = document.getElementById("imageLogoutButton");
    var uploadFeedback = document.getElementById("imageUploadFeedback");
    var libraryFeedback = document.getElementById("imageLibraryFeedback");
    var editFeedback = document.getElementById("imageEditFeedback");
    var uploadForm = document.getElementById("imageUploadForm");
    var editForm = document.getElementById("imageEditForm");
    var library = document.getElementById("imageLibrary");
    var ownerTypeField = document.getElementById("imageOwnerType");
    var ownerIdField = document.getElementById("imageOwnerId");
    var filterOwnerTypeField = document.getElementById("imageFilterOwnerType");
    var filterOwnerIdField = document.getElementById("imageFilterOwnerId");
    var refreshImagesButton = document.getElementById("refreshImagesButton");
    var clearImageEditButton = document.getElementById("clearImageEditButton");

    var state = {
        auth: null,
        litters: [],
        puppies: [],
        images: []
    };

    function setFeedback(element, message, isError) {
        if (!element) {
            return;
        }

        element.textContent = message || "";
        element.classList.toggle("is-error", Boolean(message && isError));
        element.classList.toggle("is-success", Boolean(message && !isError));
    }

    async function apiFetch(url, options) {
        var response = await fetch(url, options || {});
        var data = null;

        try {
            data = await response.json();
        } catch (error) {
            data = null;
        }

        if (!response.ok) {
            throw new Error((data && (data.error || (data.details && data.details.join(", ")))) || "Request failed.");
        }

        return data;
    }

    function updateAuthSummary() {
        if (!state.auth || !state.auth.isAuthenticated) {
            authSummary.textContent = "You are not signed in. Use Google sign-in to manage image uploads.";
            loginButton.style.display = "inline-flex";
            logoutButton.style.display = "none";
            return;
        }

        if (!state.auth.isAdmin) {
            authSummary.textContent = "You are signed in, but this account is not currently approved as an admin.";
            loginButton.style.display = "none";
            logoutButton.style.display = "inline-flex";
            return;
        }

        authSummary.textContent = "Signed in as " + (state.auth.userDetails || "admin") + ". Blob-backed image management is available.";
        loginButton.style.display = "none";
        logoutButton.style.display = "inline-flex";
    }

    function resetEditForm() {
        editForm.reset();
        document.getElementById("editImageId").value = "";
        setFeedback(editFeedback, "", false);
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatBytes(value) {
        if (!value && value !== 0) {
            return "n/a";
        }

        if (value < 1024) {
            return value + " B";
        }

        if (value < 1024 * 1024) {
            return (value / 1024).toFixed(1) + " KB";
        }

        return (value / (1024 * 1024)).toFixed(1) + " MB";
    }

    function renderOwnerOptions(target, includeAllOption) {
        var options = [];

        if (includeAllOption) {
            options.push('<option value="">All Records</option>');
        } else {
            options.push('<option value="">Not Required</option>');
        }

        var ownerType = target === ownerIdField ? ownerTypeField.value : filterOwnerTypeField.value;

        if (ownerType === "puppy") {
            state.puppies.forEach(function (puppy) {
                options.push('<option value="' + puppy.id + '">' + escapeHtml(puppy.displayName) + " • " + escapeHtml(findLitterTitle(puppy.litterId)) + "</option>");
            });
        } else if (ownerType === "litter") {
            state.litters.forEach(function (litter) {
                options.push('<option value="' + litter.id + '">' + escapeHtml(litter.title) + "</option>");
            });
        }

        target.innerHTML = options.join("");
    }

    function findLitterTitle(litterId) {
        var litter = state.litters.find(function (item) {
            return item.id === litterId;
        });

        return litter ? litter.title : "Unknown litter";
    }

    function renderImages() {
        if (!state.images.length) {
            library.innerHTML = '<div class="admin-empty-state">No images match the current filter yet.</div>';
            return;
        }

        library.innerHTML = state.images.map(function (image) {
            return '' +
                '<article class="admin-image-card">' +
                    '<button type="button" class="admin-image-card__button" data-image-id="' + image.id + '">' +
                        '<div class="admin-image-card__media">' +
                            (image.imageUrl ? '<img src="' + escapeHtml(image.imageUrl) + '" alt="' + escapeHtml(image.altText || image.originalFileName || "Image preview") + '">' : '<div class="admin-image-card__placeholder">No preview</div>') +
                        '</div>' +
                        '<div class="admin-image-card__body">' +
                            '<div class="admin-record-card__top">' +
                                '<div>' +
                                    '<h3>' + escapeHtml(image.originalFileName || image.id) + '</h3>' +
                                    '<p>' + escapeHtml(image.ownerType) + (image.ownerId ? " • " + escapeHtml(image.ownerId) : "") + '</p>' +
                                '</div>' +
                                '<span class="admin-badge ' + (image.isActive ? "is-live" : "") + '">' + (image.isActive ? "active" : "inactive") + '</span>' +
                            '</div>' +
                            '<div class="admin-record-card__meta">' +
                                '<span>' + escapeHtml(image.containerName || "container") + '</span>' +
                                '<span>' + formatBytes(image.sizeBytes) + '</span>' +
                                '<span>Order: ' + (image.displayOrder == null ? "n/a" : image.displayOrder) + '</span>' +
                            '</div>' +
                            '<p>' + escapeHtml(image.altText || image.caption || "No metadata yet.") + '</p>' +
                        '</div>' +
                    '</button>' +
                '</article>';
        }).join("");
    }

    async function loadAuth() {
        try {
            var data = await apiFetch("/api/manage/me");
            state.auth = data.auth || null;
        } catch (error) {
            state.auth = { isAuthenticated: false, isAdmin: false };
        }

        updateAuthSummary();
    }

    async function loadLittersAndPuppies() {
        var litterData = await apiFetch("/api/manage/litters");
        state.litters = Array.isArray(litterData.litters) ? litterData.litters : [];

        var puppyData = await apiFetch("/api/manage/puppies");
        state.puppies = Array.isArray(puppyData.puppies) ? puppyData.puppies : [];

        renderOwnerOptions(ownerIdField, false);
        renderOwnerOptions(filterOwnerIdField, true);
    }

    async function loadImages() {
        var params = new URLSearchParams();

        if (filterOwnerTypeField.value) {
            params.set("ownerType", filterOwnerTypeField.value);
        }

        if (filterOwnerIdField.value) {
            params.set("ownerId", filterOwnerIdField.value);
        }

        var sectionKey = document.getElementById("imageFilterSectionKey").value.trim();

        if (sectionKey) {
            params.set("sectionKey", sectionKey);
        }

        var url = "/api/manage/images";

        if (params.toString()) {
            url += "?" + params.toString();
        }

        var data = await apiFetch(url);
        state.images = Array.isArray(data.images) ? data.images : [];
        renderImages();
    }

    function readFileAsBase64(file) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();

            reader.onload = function () {
                var result = reader.result || "";
                var base64 = String(result).split(",")[1] || "";
                resolve(base64);
            };

            reader.onerror = function () {
                reject(new Error("Unable to read the selected file."));
            };

            reader.readAsDataURL(file);
        });
    }

    async function handleUploadSubmit(event) {
        event.preventDefault();
        setFeedback(uploadFeedback, "Uploading image...", false);

        try {
            var fileInput = document.getElementById("imageFile");
            var file = fileInput.files && fileInput.files[0];

            if (!file) {
                throw new Error("Select an image file before uploading.");
            }

            var payload = {
                ownerType: ownerTypeField.value,
                ownerId: ownerIdField.value,
                sectionKey: document.getElementById("imageSectionKey").value,
                weekLabel: document.getElementById("imageWeekLabel").value,
                displayOrder: document.getElementById("imageDisplayOrder").value,
                isActive: document.getElementById("imageIsActive").checked,
                altText: document.getElementById("imageAltText").value,
                caption: document.getElementById("imageCaption").value,
                fileName: file.name,
                contentType: file.type || "application/octet-stream",
                base64Data: await readFileAsBase64(file)
            };

            var result = await apiFetch("/api/manage/images", {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            uploadForm.reset();
            document.getElementById("imageIsActive").checked = true;
            renderOwnerOptions(ownerIdField, false);
            await loadImages();
            populateEditForm(result.image);
            setFeedback(uploadFeedback, "Image uploaded successfully.", false);
        } catch (error) {
            setFeedback(uploadFeedback, error.message, true);
        }
    }

    function populateEditForm(image) {
        document.getElementById("editImageId").value = image.id;
        document.getElementById("editImageOwnerType").value = image.ownerType || "";
        document.getElementById("editImageOwnerId").value = image.ownerId || "";
        document.getElementById("editImageSectionKey").value = image.sectionKey || "";
        document.getElementById("editImageWeekLabel").value = image.weekLabel || "";
        document.getElementById("editImageDisplayOrder").value = image.displayOrder == null ? "" : image.displayOrder;
        document.getElementById("editImageIsActive").checked = Boolean(image.isActive);
        document.getElementById("editImageFeatured").checked = Boolean(image.featured);
        document.getElementById("editImageAltText").value = image.altText || "";
        document.getElementById("editImageCaption").value = image.caption || "";
        setFeedback(editFeedback, "Editing image: " + (image.originalFileName || image.id), false);
        editForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function handleEditSubmit(event) {
        event.preventDefault();
        var id = document.getElementById("editImageId").value;

        if (!id) {
            setFeedback(editFeedback, "Select an image from the library first.", true);
            return;
        }

        setFeedback(editFeedback, "Saving image metadata...", false);

        try {
            var imageData = await apiFetch("/api/manage/images/" + encodeURIComponent(id), {
                method: "PUT",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    sectionKey: document.getElementById("editImageSectionKey").value,
                    weekLabel: document.getElementById("editImageWeekLabel").value,
                    displayOrder: document.getElementById("editImageDisplayOrder").value,
                    isActive: document.getElementById("editImageIsActive").checked,
                    featured: document.getElementById("editImageFeatured").checked,
                    altText: document.getElementById("editImageAltText").value,
                    caption: document.getElementById("editImageCaption").value
                })
            });

            await loadImages();
            populateEditForm(imageData.image);
            setFeedback(editFeedback, "Image metadata saved successfully.", false);
        } catch (error) {
            setFeedback(editFeedback, error.message, true);
        }
    }

    function bindEvents() {
        ownerTypeField.addEventListener("change", function () {
            renderOwnerOptions(ownerIdField, false);
        });

        filterOwnerTypeField.addEventListener("change", function () {
            renderOwnerOptions(filterOwnerIdField, true);
        });

        refreshImagesButton.addEventListener("click", function () {
            loadImages().catch(function (error) {
                setFeedback(libraryFeedback, error.message, true);
            });
        });

        library.addEventListener("click", function (event) {
            var button = event.target.closest("[data-image-id]");

            if (!button) {
                return;
            }

            var id = button.getAttribute("data-image-id");
            var image = state.images.find(function (item) {
                return item.id === id;
            });

            if (image) {
                populateEditForm(image);
            }
        });

        uploadForm.addEventListener("submit", handleUploadSubmit);
        editForm.addEventListener("submit", handleEditSubmit);
        clearImageEditButton.addEventListener("click", resetEditForm);
    }

    async function initialize() {
        bindEvents();
        await loadAuth();

        if (!state.auth || !state.auth.isAdmin) {
            setFeedback(uploadFeedback, "Admin access is required before image uploads can be used.", true);
            setFeedback(libraryFeedback, "Admin access is required before the image library can load.", true);
            setFeedback(editFeedback, "Admin access is required before image metadata can be edited.", true);
            return;
        }

        await loadLittersAndPuppies();
        await loadImages();
    }

    initialize().catch(function (error) {
        setFeedback(uploadFeedback, error.message, true);
        setFeedback(libraryFeedback, error.message, true);
    });
}());
