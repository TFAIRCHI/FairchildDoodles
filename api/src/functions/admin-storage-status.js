const { app } = require("@azure/functions");
const { requireAdmin } = require("../shared/admin");
const { validateConfiguredContainers } = require("../shared/blob");
const { json } = require("../shared/response");

app.http("admin-storage-status", {
  route: "manage/storage-status",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const admin = requireAdmin(request);

    if (!admin.ok) {
      return admin.response;
    }

    try {
      const containers = await validateConfiguredContainers();

      context.log("Validated blob storage container configuration", {
        userId: admin.principal.userId ?? null
      });

      return json({
        ok: true,
        storage: {
          containers
        }
      });
    } catch (error) {
      context.error("Blob storage validation failed", {
        message: error.message
      });

      return json(
        {
          ok: false,
          error: "Storage configuration validation failed.",
          detail: error.message
        },
        { status: 500 }
      );
    }
  }
});
