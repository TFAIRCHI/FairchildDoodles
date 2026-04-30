(function () {
    var pageKey = document.body.getAttribute("data-admin-content-page");

    if (!pageKey) {
        return;
    }

    var fieldContainer = document.getElementById("contentFields");
    var feedback = document.getElementById("contentFeedback");
    var authSummary = document.getElementById("contentAuthSummary");
    var loginButton = document.getElementById("contentLoginButton");
    var logoutButton = document.getElementById("contentLogoutButton");
    var form = document.getElementById("contentForm");
    var state = {
        auth: null,
        existingBlocks: new Map()
    };

    var definitions = {
        about: [
            { sectionKey: "header", fieldKey: "title", label: "Header Title", rows: 1 },
            { sectionKey: "header", fieldKey: "subtitle", label: "Header Subtitle", rows: 2 },
            { sectionKey: "story", fieldKey: "title", label: "Story Section Title", rows: 1 },
            { sectionKey: "story", fieldKey: "paragraph1", label: "Story Paragraph 1", rows: 4 },
            { sectionKey: "story", fieldKey: "paragraph2", label: "Story Paragraph 2", rows: 4 },
            { sectionKey: "story", fieldKey: "paragraph3", label: "Story Paragraph 3", rows: 4 },
            { sectionKey: "story", fieldKey: "paragraph4", label: "Story Paragraph 4", rows: 4 },
            { sectionKey: "parents", fieldKey: "sectionTitle", label: "Parents Section Title", rows: 1 },
            { sectionKey: "parents", fieldKey: "sectionSubtitle", label: "Parents Section Subtitle", rows: 2 },
            { sectionKey: "parents", fieldKey: "cardTitle", label: "Parents Card Title", rows: 1 },
            { sectionKey: "parents", fieldKey: "cardSummary", label: "Parents Card Summary", rows: 3 },
            { sectionKey: "parents", fieldKey: "sadieName", label: "Sadie Name", rows: 1 },
            { sectionKey: "parents", fieldKey: "sadieDescription", label: "Sadie Description", rows: 3 },
            { sectionKey: "parents", fieldKey: "broncoName", label: "Bronco Name", rows: 1 },
            { sectionKey: "parents", fieldKey: "broncoDescription", label: "Bronco Description", rows: 3 },
            { sectionKey: "cta", fieldKey: "title", label: "CTA Title", rows: 2 },
            { sectionKey: "cta", fieldKey: "body", label: "CTA Body", rows: 2 },
            { sectionKey: "cta", fieldKey: "primaryLabel", label: "Primary CTA Label", rows: 1 },
            { sectionKey: "cta", fieldKey: "secondaryLabel", label: "Secondary CTA Label", rows: 1 }
        ],
        contact: [
            { sectionKey: "header", fieldKey: "title", label: "Header Title", rows: 1 },
            { sectionKey: "header", fieldKey: "subtitle", label: "Header Subtitle", rows: 2 },
            { sectionKey: "contact", fieldKey: "title", label: "Contact Card Title", rows: 1 },
            { sectionKey: "contact", fieldKey: "locationLabel", label: "Location Label", rows: 1 },
            { sectionKey: "contact", fieldKey: "locationValue", label: "Location Value", rows: 3 },
            { sectionKey: "contact", fieldKey: "emailLabel", label: "Email Label", rows: 1 },
            { sectionKey: "contact", fieldKey: "emailValue", label: "Email Value", rows: 1 },
            { sectionKey: "contact", fieldKey: "phoneLabel", label: "Phone Label", rows: 1 },
            { sectionKey: "contact", fieldKey: "phoneValue", label: "Phone Value", rows: 1 },
            { sectionKey: "contact", fieldKey: "responseLabel", label: "Response Time Label", rows: 1 },
            { sectionKey: "contact", fieldKey: "responseValue", label: "Response Time Value", rows: 2 },
            { sectionKey: "expectations", fieldKey: "title", label: "Expectations Section Title", rows: 1 },
            { sectionKey: "expectations", fieldKey: "step1Title", label: "Step 1 Title", rows: 1 },
            { sectionKey: "expectations", fieldKey: "step1Description", label: "Step 1 Description", rows: 3 },
            { sectionKey: "expectations", fieldKey: "step2Title", label: "Step 2 Title", rows: 1 },
            { sectionKey: "expectations", fieldKey: "step2Description", label: "Step 2 Description", rows: 3 },
            { sectionKey: "expectations", fieldKey: "step3Title", label: "Step 3 Title", rows: 1 },
            { sectionKey: "expectations", fieldKey: "step3Description", label: "Step 3 Description", rows: 3 },
            { sectionKey: "expectations", fieldKey: "step4Title", label: "Step 4 Title", rows: 1 },
            { sectionKey: "expectations", fieldKey: "step4Description", label: "Step 4 Description", rows: 3 },
            { sectionKey: "expectations", fieldKey: "step5Title", label: "Step 5 Title", rows: 1 },
            { sectionKey: "expectations", fieldKey: "step5Description", label: "Step 5 Description", rows: 3 },
            { sectionKey: "expectations", fieldKey: "step6Title", label: "Step 6 Title", rows: 1 },
            { sectionKey: "expectations", fieldKey: "step6Description", label: "Step 6 Description", rows: 3 },
            { sectionKey: "expectations", fieldKey: "step7Title", label: "Step 7 Title", rows: 1 },
            { sectionKey: "expectations", fieldKey: "step7Description", label: "Step 7 Description", rows: 3 }
        ]
    };

    function setFeedback(message, isError) {
        feedback.textContent = message || "";
        feedback.classList.toggle("is-error", Boolean(message && isError));
        feedback.classList.toggle("is-success", Boolean(message && !isError));
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
            throw new Error((data && data.error) || "Request failed.");
        }

        return data;
    }

    function renderAuth() {
        if (!state.auth || !state.auth.isAuthenticated) {
            authSummary.textContent = "You are not signed in. Use Google sign-in to edit this page content.";
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

        authSummary.textContent = "Signed in as " + (state.auth.userDetails || "admin") + ". You can edit and save " + pageKey + " page copy.";
        loginButton.style.display = "none";
        logoutButton.style.display = "inline-flex";
    }

    function fieldId(definition) {
        return definition.sectionKey + "__" + definition.fieldKey;
    }

    function compositeKey(definition) {
        return definition.sectionKey + "." + definition.fieldKey;
    }

    function renderFields() {
        fieldContainer.innerHTML = definitions[pageKey].map(function (definition) {
            return '' +
                '<div class="form-group form-group--full">' +
                    '<label for="' + fieldId(definition) + '">' + definition.label + '</label>' +
                    '<textarea id="' + fieldId(definition) + '" rows="' + definition.rows + '"></textarea>' +
                '</div>';
        }).join("");
    }

    async function loadAuth() {
        try {
            var data = await apiFetch("/api/manage/me");
            state.auth = data.auth || null;
        } catch (error) {
            state.auth = { isAuthenticated: false, isAdmin: false };
        }

        renderAuth();
    }

    async function loadBlocks() {
        var data = await apiFetch("/api/manage/text-blocks?pageKey=" + encodeURIComponent(pageKey));
        var blocks = Array.isArray(data.textBlocks) ? data.textBlocks : [];

        state.existingBlocks = new Map();
        blocks.forEach(function (block) {
            state.existingBlocks.set(block.sectionKey + "." + block.fieldKey, block);
        });

        definitions[pageKey].forEach(function (definition) {
            var block = state.existingBlocks.get(compositeKey(definition));
            var field = document.getElementById(fieldId(definition));

            if (field) {
                field.value = block ? block.contentValue : "";
            }
        });
    }

    async function saveDefinition(definition, displayOrder) {
        var value = document.getElementById(fieldId(definition)).value;
        var key = compositeKey(definition);
        var existing = state.existingBlocks.get(key);
        var payload = {
            pageKey: pageKey,
            sectionKey: definition.sectionKey,
            fieldKey: definition.fieldKey,
            fieldLabel: definition.label,
            contentValue: value,
            inputType: "textarea",
            displayOrder: displayOrder,
            isActive: true
        };

        if (existing) {
            return apiFetch("/api/manage/text-blocks/" + encodeURIComponent(existing.id), {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload)
            });
        }

        return apiFetch("/api/manage/text-blocks", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload)
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setFeedback("Saving content...", false);

        try {
            for (var i = 0; i < definitions[pageKey].length; i += 1) {
                await saveDefinition(definitions[pageKey][i], i + 1);
            }

            await loadBlocks();
            setFeedback("Content saved successfully.", false);
        } catch (error) {
            setFeedback(error.message, true);
        }
    }

    async function init() {
        renderFields();
        await loadAuth();

        if (!state.auth || !state.auth.isAdmin) {
            setFeedback("Admin access is required before page content can be loaded.", true);
            return;
        }

        await loadBlocks();
    }

    form.addEventListener("submit", handleSubmit);
    init().catch(function (error) {
        setFeedback(error.message, true);
    });
}());
