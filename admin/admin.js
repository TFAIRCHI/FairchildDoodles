(function () {
    var state = {
        auth: null,
        litters: [],
        puppies: [],
        currentLitterFilter: ""
    };

    var adminAuthSummary = document.getElementById("adminAuthSummary");
    var litterFeedback = document.getElementById("litterFeedback");
    var puppyFeedback = document.getElementById("puppyFeedback");
    var litterList = document.getElementById("litterList");
    var puppyList = document.getElementById("puppyList");
    var puppyLitterFilter = document.getElementById("puppyLitterFilter");
    var puppyLitterId = document.getElementById("puppyLitterId");
    var litterForm = document.getElementById("litterForm");
    var puppyForm = document.getElementById("puppyForm");
    var loginButton = document.getElementById("adminLoginButton");
    var logoutButton = document.getElementById("adminLogoutButton");
    var newLitterButton = document.getElementById("newLitterButton");
    var newPuppyButton = document.getElementById("newPuppyButton");
    var cancelLitterEditButton = document.getElementById("cancelLitterEditButton");
    var cancelPuppyEditButton = document.getElementById("cancelPuppyEditButton");

    function setFeedback(element, message, isError) {
        if (!element) {
            return;
        }

        element.textContent = message || "";
        element.classList.toggle("is-error", Boolean(isError && message));
        element.classList.toggle("is-success", Boolean(!isError && message));
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
            var message = data && (data.error || data.detail);
            throw new Error(message || "Request failed.");
        }

        return data;
    }

    function updateAuthSummary() {
        if (!state.auth || !state.auth.isAuthenticated) {
            adminAuthSummary.textContent = "You are not signed in. Use Google sign-in to access the admin controls.";
            loginButton.style.display = "inline-flex";
            logoutButton.style.display = "none";
            return;
        }

        if (!state.auth.isAdmin) {
            adminAuthSummary.textContent = "You are signed in as " + (state.auth.userDetails || "an authenticated user") + ", but this account is not in the admin allowlist yet.";
            loginButton.style.display = "none";
            logoutButton.style.display = "inline-flex";
            return;
        }

        adminAuthSummary.textContent = "Signed in as " + (state.auth.userDetails || "admin") + ". Admin endpoints are available.";
        loginButton.style.display = "none";
        logoutButton.style.display = "inline-flex";
    }

    async function loadAuth() {
        try {
            var data = await apiFetch("/api/manage/me");
            state.auth = data.auth || null;
        } catch (error) {
            state.auth = {
                isAuthenticated: false,
                isAdmin: false
            };
        }

        updateAuthSummary();
    }

    function renderLitterOptions() {
        var options = ['<option value="">All Litters</option>'];

        state.litters.forEach(function (litter) {
            options.push('<option value="' + litter.id + '">' + escapeHtml(litter.title) + "</option>");
        });

        puppyLitterFilter.innerHTML = options.join("");
        puppyLitterFilter.value = state.currentLitterFilter;

        var editOptions = ['<option value="">Select a litter</option>'];

        state.litters.forEach(function (litter) {
            editOptions.push('<option value="' + litter.id + '">' + escapeHtml(litter.title) + "</option>");
        });

        puppyLitterId.innerHTML = editOptions.join("");
    }

    function renderLitters() {
        if (!state.litters.length) {
            litterList.innerHTML = '<div class="admin-empty-state">No litters exist yet. Create the first litter to begin managing puppies.</div>';
            return;
        }

        litterList.innerHTML = state.litters.map(function (litter) {
            return '' +
                '<article class="admin-record-card">' +
                    '<div class="admin-record-card__top">' +
                        '<div>' +
                            '<h3>' + escapeHtml(litter.title) + '</h3>' +
                            '<p>' + escapeHtml(litter.birthDate || "No birth date yet") + ' • ' + escapeHtml(litter.readyDate || "No ready date yet") + '</p>' +
                        '</div>' +
                        '<span class="admin-badge ' + (litter.isActive ? "is-live" : "") + '">' + escapeHtml(litter.status || "active") + '</span>' +
                    '</div>' +
                    '<div class="admin-record-card__meta">' +
                        '<span>Male: ' + formatMoney(litter.defaultMalePrice) + '</span>' +
                        '<span>Female: ' + formatMoney(litter.defaultFemalePrice) + '</span>' +
                        '<span>Order: ' + (litter.displayOrder == null ? "n/a" : litter.displayOrder) + '</span>' +
                    '</div>' +
                    '<p>' + escapeHtml(litter.summaryText || "No summary text yet.") + '</p>' +
                    '<div class="admin-record-card__actions">' +
                        '<button type="button" class="cta-button cta-button--outline admin-compact-button" data-edit-litter="' + litter.id + '">EDIT</button>' +
                        '<button type="button" class="cta-button cta-button--outline admin-compact-button" data-filter-puppies="' + litter.id + '">VIEW PUPPIES</button>' +
                    '</div>' +
                '</article>';
        }).join("");
    }

    function renderPuppies() {
        if (!state.puppies.length) {
            puppyList.innerHTML = '<div class="admin-empty-state">No puppies match the current filter yet. Create a puppy record once the litter is ready.</div>';
            return;
        }

        puppyList.innerHTML = state.puppies.map(function (puppy) {
            return '' +
                '<article class="admin-record-card">' +
                    '<div class="admin-record-card__top">' +
                        '<div>' +
                            '<h3>' + escapeHtml(puppy.displayName) + '</h3>' +
                            '<p>' + escapeHtml(findLitterTitle(puppy.litterId)) + ' • ' + escapeHtml(puppy.gender || "Gender not set") + '</p>' +
                        '</div>' +
                        '<span class="admin-badge ' + availabilityBadgeClass(puppy.availabilityStatus) + '">' + escapeHtml(puppy.availabilityStatus || "available") + '</span>' +
                    '</div>' +
                    '<div class="admin-record-card__meta">' +
                        '<span>Price: ' + formatMoney(puppy.price) + '</span>' +
                        '<span>Color: ' + escapeHtml(puppy.colorLabel || "n/a") + '</span>' +
                        '<span>Order: ' + (puppy.displayOrder == null ? "n/a" : puppy.displayOrder) + '</span>' +
                    '</div>' +
                    '<p>' + escapeHtml(puppy.shortSummary || puppy.longDescription || "No description yet.") + '</p>' +
                    '<div class="admin-record-card__actions">' +
                        '<button type="button" class="cta-button cta-button--outline admin-compact-button" data-edit-puppy="' + puppy.id + '">EDIT</button>' +
                    '</div>' +
                '</article>';
        }).join("");
    }

    function findLitterTitle(litterId) {
        var match = state.litters.find(function (litter) {
            return litter.id === litterId;
        });

        return match ? match.title : "Unknown litter";
    }

    async function loadLitters() {
        var data = await apiFetch("/api/manage/litters");
        state.litters = Array.isArray(data.litters) ? data.litters : [];
        renderLitterOptions();
        renderLitters();
    }

    async function loadPuppies() {
        var url = "/api/manage/puppies";

        if (state.currentLitterFilter) {
            url += "?litterId=" + encodeURIComponent(state.currentLitterFilter);
        }

        var data = await apiFetch(url);
        state.puppies = Array.isArray(data.puppies) ? data.puppies : [];
        renderPuppies();
    }

    function resetLitterForm() {
        litterForm.reset();
        document.getElementById("litterId").value = "";
        document.getElementById("litterStatus").value = "active";
        document.getElementById("litterIsActive").checked = false;
        setFeedback(litterFeedback, "", false);
    }

    function resetPuppyForm() {
        puppyForm.reset();
        document.getElementById("puppyId").value = "";
        document.getElementById("puppyAvailabilityStatus").value = "available";
        document.getElementById("puppyIsActive").checked = false;
        if (state.currentLitterFilter) {
            puppyLitterId.value = state.currentLitterFilter;
        }
        setFeedback(puppyFeedback, "", false);
    }

    function populateLitterForm(litter) {
        document.getElementById("litterId").value = litter.id;
        document.getElementById("litterTitle").value = litter.title || "";
        document.getElementById("litterStatus").value = litter.status || "active";
        document.getElementById("litterBirthDate").value = litter.birthDate || "";
        document.getElementById("litterReadyDate").value = litter.readyDate || "";
        document.getElementById("litterMalePrice").value = litter.defaultMalePrice == null ? "" : litter.defaultMalePrice;
        document.getElementById("litterFemalePrice").value = litter.defaultFemalePrice == null ? "" : litter.defaultFemalePrice;
        document.getElementById("litterDisplayOrder").value = litter.displayOrder == null ? "" : litter.displayOrder;
        document.getElementById("litterBannerText").value = litter.bannerText || "";
        document.getElementById("litterSummaryText").value = litter.summaryText || "";
        document.getElementById("litterIsActive").checked = Boolean(litter.isActive);
        setFeedback(litterFeedback, "Editing litter: " + litter.title, false);
        litterForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function populatePuppyForm(puppy) {
        document.getElementById("puppyId").value = puppy.id;
        puppyLitterId.value = puppy.litterId || "";
        document.getElementById("puppyDisplayName").value = puppy.displayName || "";
        document.getElementById("puppyGender").value = puppy.gender || "";
        document.getElementById("puppyColorLabel").value = puppy.colorLabel || "";
        document.getElementById("puppyPrice").value = puppy.price == null ? "" : puppy.price;
        document.getElementById("puppyAvailabilityStatus").value = puppy.availabilityStatus || "available";
        document.getElementById("puppyDisplayOrder").value = puppy.displayOrder == null ? "" : puppy.displayOrder;
        document.getElementById("puppyFeaturedImageId").value = puppy.featuredImageId || "";
        document.getElementById("puppyShortSummary").value = puppy.shortSummary || "";
        document.getElementById("puppyLongDescription").value = puppy.longDescription || "";
        document.getElementById("puppyIsActive").checked = Boolean(puppy.isActive);
        setFeedback(puppyFeedback, "Editing puppy: " + puppy.displayName, false);
        puppyForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatMoney(value) {
        if (value == null || value === "") {
            return "n/a";
        }

        return "$" + Number(value).toLocaleString();
    }

    function availabilityBadgeClass(status) {
        if (status === "sold") {
            return "is-sold";
        }

        if (status === "reserved") {
            return "is-reserved";
        }

        return "is-live";
    }

    function collectLitterFormData() {
        return {
            title: document.getElementById("litterTitle").value,
            status: document.getElementById("litterStatus").value,
            birthDate: document.getElementById("litterBirthDate").value,
            readyDate: document.getElementById("litterReadyDate").value,
            defaultMalePrice: document.getElementById("litterMalePrice").value,
            defaultFemalePrice: document.getElementById("litterFemalePrice").value,
            displayOrder: document.getElementById("litterDisplayOrder").value,
            bannerText: document.getElementById("litterBannerText").value,
            summaryText: document.getElementById("litterSummaryText").value,
            isActive: document.getElementById("litterIsActive").checked
        };
    }

    function collectPuppyFormData() {
        return {
            litterId: puppyLitterId.value,
            displayName: document.getElementById("puppyDisplayName").value,
            gender: document.getElementById("puppyGender").value,
            colorLabel: document.getElementById("puppyColorLabel").value,
            price: document.getElementById("puppyPrice").value,
            availabilityStatus: document.getElementById("puppyAvailabilityStatus").value,
            displayOrder: document.getElementById("puppyDisplayOrder").value,
            featuredImageId: document.getElementById("puppyFeaturedImageId").value,
            shortSummary: document.getElementById("puppyShortSummary").value,
            longDescription: document.getElementById("puppyLongDescription").value,
            isActive: document.getElementById("puppyIsActive").checked
        };
    }

    async function handleLitterSubmit(event) {
        event.preventDefault();
        setFeedback(litterFeedback, "Saving litter...", false);

        var id = document.getElementById("litterId").value;
        var method = id ? "PUT" : "POST";
        var url = id ? "/api/manage/litters/" + encodeURIComponent(id) : "/api/manage/litters";

        try {
            await apiFetch(url, {
                method: method,
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify(collectLitterFormData())
            });

            await loadLitters();
            if (state.currentLitterFilter) {
                await loadPuppies();
            }
            setFeedback(litterFeedback, "Litter saved successfully.", false);
            resetLitterForm();
        } catch (error) {
            setFeedback(litterFeedback, error.message, true);
        }
    }

    async function handlePuppySubmit(event) {
        event.preventDefault();
        setFeedback(puppyFeedback, "Saving puppy...", false);

        var id = document.getElementById("puppyId").value;
        var method = id ? "PUT" : "POST";
        var url = id ? "/api/manage/puppies/" + encodeURIComponent(id) : "/api/manage/puppies";

        try {
            await apiFetch(url, {
                method: method,
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify(collectPuppyFormData())
            });

            await loadPuppies();
            setFeedback(puppyFeedback, "Puppy saved successfully.", false);
            resetPuppyForm();
        } catch (error) {
            setFeedback(puppyFeedback, error.message, true);
        }
    }

    function bindListActions() {
        litterList.addEventListener("click", function (event) {
            var editId = event.target.getAttribute("data-edit-litter");
            var filterId = event.target.getAttribute("data-filter-puppies");

            if (editId) {
                var litter = state.litters.find(function (item) {
                    return item.id === editId;
                });

                if (litter) {
                    populateLitterForm(litter);
                }
            }

            if (filterId) {
                state.currentLitterFilter = filterId;
                puppyLitterFilter.value = filterId;
                puppyLitterId.value = filterId;
                loadPuppies().catch(function (error) {
                    setFeedback(puppyFeedback, error.message, true);
                });
            }
        });

        puppyList.addEventListener("click", function (event) {
            var editId = event.target.getAttribute("data-edit-puppy");

            if (!editId) {
                return;
            }

            var puppy = state.puppies.find(function (item) {
                return item.id === editId;
            });

            if (puppy) {
                populatePuppyForm(puppy);
            }
        });
    }

    async function initialize() {
        bindListActions();

        puppyLitterFilter.addEventListener("change", function () {
            state.currentLitterFilter = puppyLitterFilter.value;
            if (state.currentLitterFilter) {
                puppyLitterId.value = state.currentLitterFilter;
            }
            loadPuppies().catch(function (error) {
                setFeedback(puppyFeedback, error.message, true);
            });
        });

        litterForm.addEventListener("submit", handleLitterSubmit);
        puppyForm.addEventListener("submit", handlePuppySubmit);
        newLitterButton.addEventListener("click", resetLitterForm);
        newPuppyButton.addEventListener("click", resetPuppyForm);
        cancelLitterEditButton.addEventListener("click", resetLitterForm);
        cancelPuppyEditButton.addEventListener("click", resetPuppyForm);

        await loadAuth();

        if (!state.auth || !state.auth.isAdmin) {
            renderLitterOptions();
            renderLitters();
            renderPuppies();
            setFeedback(litterFeedback, "Admin access is required before litter management can load.", true);
            setFeedback(puppyFeedback, "Admin access is required before puppy management can load.", true);
            return;
        }

        try {
            await loadLitters();
            if (state.litters.length && !state.currentLitterFilter) {
                state.currentLitterFilter = state.litters[0].id;
                puppyLitterFilter.value = state.currentLitterFilter;
                puppyLitterId.value = state.currentLitterFilter;
            }
            await loadPuppies();
            resetPuppyForm();
        } catch (error) {
            setFeedback(litterFeedback, error.message, true);
            setFeedback(puppyFeedback, error.message, true);
        }
    }

    initialize();
}());
