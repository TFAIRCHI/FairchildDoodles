const { parseClientPrincipal, isAuthorizedAdmin } = require("./auth");
const { json } = require("./response");

function requireAdmin(request) {
  const principal = parseClientPrincipal(request);

  if (!principal) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          error: "Authentication required."
        },
        { status: 401 }
      )
    };
  }

  if (!isAuthorizedAdmin(principal)) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          error: "Admin access required."
        },
        { status: 403 }
      )
    };
  }

  return {
    ok: true,
    principal
  };
}

module.exports = {
  requireAdmin
};
