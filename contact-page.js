(function () {
    var headerTitle = document.getElementById("contactHeaderTitle");

    if (!headerTitle) {
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

    function renderSteps(steps) {
        var list = document.getElementById("contactExpectationsList");

        list.innerHTML = (steps || []).map(function (step) {
            return '' +
                '<div class="expect-step">' +
                    '<span class="expect-number">' + escapeHtml(step.number) + '</span>' +
                    '<div>' +
                        '<strong>' + escapeHtml(step.title) + '</strong>' +
                        '<p>' + escapeHtml(step.description) + '</p>' +
                    '</div>' +
                '</div>';
        }).join("");
    }

    fetch("/api/public/contact-page")
        .then(function (response) { return response.json(); })
        .then(function (data) {
            if (!data || !data.page) {
                return;
            }

            var page = data.page;

            document.getElementById("contactHeaderTitle").textContent = page.headerTitle;
            document.getElementById("contactHeaderSubtitle").textContent = page.headerSubtitle;
            document.getElementById("contactCardTitle").textContent = page.contactCardTitle;
            document.getElementById("contactLocationLabel").textContent = page.contactLocationLabel;
            document.getElementById("contactLocationValue").innerHTML = page.contactLocationValue;
            document.getElementById("contactEmailLabel").textContent = page.contactEmailLabel;
            document.getElementById("contactPhoneLabel").textContent = page.contactPhoneLabel;
            document.getElementById("contactPhoneValue").textContent = page.contactPhoneValue;
            document.getElementById("contactResponseLabel").textContent = page.contactResponseLabel;
            document.getElementById("contactResponseValue").textContent = page.contactResponseValue;
            document.getElementById("contactExpectationsTitle").textContent = page.expectationsTitle;

            var emailLink = document.getElementById("contactEmailLink");
            emailLink.textContent = page.contactEmailValue;
            emailLink.href = "mailto:" + page.contactEmailValue;

            renderSteps(page.expectations);
        })
        .catch(function () {
            // Leave fallback copy in place when the endpoint is unavailable.
        });
}());
