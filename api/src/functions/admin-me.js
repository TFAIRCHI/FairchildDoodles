const { app } = require("@azure/functions");
const { parseClientPrincipal, isAuthorizedAdmin } = require("../shared/auth");

app.http("admin-me", {
  route: "manage/me",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const principal = parseClientPrincipal(request);
    const isAuthenticated = Boolean(principal);
    const isAdmin = isAuthorizedAdmin(principal);

    context.log("Processed admin/me request", {
      isAuthenticated,
      isAdmin,
      userId: principal?.userId ?? null
    });

    return {
      jsonBody: {
        ok: true,
        auth: {
          isAuthenticated,
          isAdmin,
          identityProvider: principal?.identityProvider ?? null,
          userId: principal?.userId ?? null,
          userDetails: principal?.userDetails ?? null
        }
      }
    };
  }
});
