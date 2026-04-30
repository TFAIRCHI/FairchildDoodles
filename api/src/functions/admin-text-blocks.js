const { app } = require("@azure/functions");
const { requireAdmin } = require("../shared/admin");
const { json } = require("../shared/response");
const {
  createTextBlock,
  getTextBlockById,
  listTextBlocks,
  parseTextBlockInput,
  updateTextBlock
} = require("../shared/text-blocks");

async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

app.http("admin-text-blocks-list-create", {
  route: "manage/text-blocks",
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (request) => {
    const admin = requireAdmin(request);

    if (!admin.ok) {
      return admin.response;
    }

    if (request.method === "GET") {
      const textBlocks = await listTextBlocks({
        pageKey: request.query.get("pageKey")?.trim() ?? "",
        sectionKey: request.query.get("sectionKey")?.trim() ?? ""
      });

      return json({
        ok: true,
        textBlocks
      });
    }

    const body = await parseBody(request);

    if (!body) {
      return json(
        {
          ok: false,
          error: "A valid JSON request body is required."
        },
        { status: 400 }
      );
    }

    const { errors, payload } = parseTextBlockInput(body, "create");

    if (errors.length > 0) {
      return json(
        {
          ok: false,
          error: "Validation failed.",
          details: errors
        },
        { status: 400 }
      );
    }

    const textBlock = await createTextBlock(payload, admin.principal);

    return json(
      {
        ok: true,
        textBlock
      },
      { status: 201 }
    );
  }
});

app.http("admin-text-blocks-detail-update", {
  route: "manage/text-blocks/{id}",
  methods: ["GET", "PUT"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const admin = requireAdmin(request);

    if (!admin.ok) {
      return admin.response;
    }

    const id = request.params.id?.trim();

    if (!id) {
      return json(
        {
          ok: false,
          error: "A text block id is required."
        },
        { status: 400 }
      );
    }

    if (request.method === "GET") {
      const textBlock = await getTextBlockById(id);

      if (!textBlock) {
        return json(
          {
            ok: false,
            error: "Text block not found."
          },
          { status: 404 }
        );
      }

      return json({
        ok: true,
        textBlock
      });
    }

    const body = await parseBody(request);

    if (!body) {
      return json(
        {
          ok: false,
          error: "A valid JSON request body is required."
        },
        { status: 400 }
      );
    }

    const { errors, payload } = parseTextBlockInput(
      {
        ...body,
        id
      },
      "update"
    );

    if (errors.length > 0) {
      return json(
        {
          ok: false,
          error: "Validation failed.",
          details: errors
        },
        { status: 400 }
      );
    }

    const textBlock = await updateTextBlock(payload, admin.principal);

    if (!textBlock) {
      return json(
        {
          ok: false,
          error: "Text block not found."
        },
        { status: 404 }
      );
    }

    context.log("Updated text block", {
      textBlockId: textBlock.id,
      pageKey: textBlock.pageKey,
      userId: admin.principal.userId ?? null
    });

    return json({
      ok: true,
      textBlock
    });
  }
});
