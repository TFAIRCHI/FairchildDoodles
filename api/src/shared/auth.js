function parseClientPrincipal(request) {
  const encoded = request.headers.get("x-ms-client-principal");

  if (!encoded) {
    return null;
  }

  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function getPrincipalRoles(principal) {
  if (!Array.isArray(principal?.userRoles)) {
    return [];
  }

  return principal.userRoles
    .map((role) => String(role || "").trim().toLowerCase())
    .filter(Boolean);
}

function getConfiguredAdminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? "";

  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function isAuthorizedAdmin(principal) {
  if (!principal) {
    return false;
  }

  const roles = getPrincipalRoles(principal);

  if (roles.includes("admin")) {
    return true;
  }

  if (!principal.userDetails) {
    return false;
  }

  const allowedEmails = getConfiguredAdminEmails();

  if (allowedEmails.length === 0) {
    return false;
  }

  return allowedEmails.includes(principal.userDetails.toLowerCase());
}

module.exports = {
  getConfiguredAdminEmails,
  getPrincipalRoles,
  isAuthorizedAdmin,
  parseClientPrincipal
};
