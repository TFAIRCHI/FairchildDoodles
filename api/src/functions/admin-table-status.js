const { app } = require("@azure/functions");
const { requireAdmin } = require("../shared/admin");
const { validateConfiguredTables } = require("../shared/tables");
const { json } = require("../shared/response");

app.http("admin-table-status", {
  route: "manage/table-status",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const admin = requireAdmin(request);

    if (!admin.ok) {
      return admin.response;
    }

    try {
      const tables = await validateConfiguredTables();

      context.log("Validated table storage configuration", {
        userId: admin.principal.userId ?? null
      });

      return json({
        ok: true,
        storage: {
          tables
        }
      });
    } catch (error) {
      context.error("Table storage validation failed", {
        message: error.message
      });

      return json(
        {
          ok: false,
          error: "Table storage configuration validation failed.",
          detail: error.message
        },
        { status: 500 }
      );
    }
  }
});
