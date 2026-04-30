const { app } = require("@azure/functions");
const { requireAdmin } = require("../shared/admin");
const { json } = require("../shared/response");
const {
  createLitter,
  getLitterById,
  listLitters,
  parseLitterInput,
  updateLitter
} = require("../shared/litters");

async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

app.http("admin-litters-list-create", {
  route: "manage/litters",
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const admin = requireAdmin(request);

    if (!admin.ok) {
      return admin.response;
    }

    if (request.method === "GET") {
      const litters = await listLitters();

      return json({
        ok: true,
        litters
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

    const { errors, payload } = parseLitterInput(body, "create");

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

    const litter = await createLitter(payload, admin.principal);

    context.log("Created litter", {
      litterId: litter.id,
      userId: admin.principal.userId ?? null
    });

    return json(
      {
        ok: true,
        litter
      },
      { status: 201 }
    );
  }
});

app.http("admin-litters-detail-update", {
  route: "manage/litters/{id}",
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
          error: "A litter id is required."
        },
        { status: 400 }
      );
    }

    if (request.method === "GET") {
      const litter = await getLitterById(id);

      if (!litter) {
        return json(
          {
            ok: false,
            error: "Litter not found."
          },
          { status: 404 }
        );
      }

      return json({
        ok: true,
        litter
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

    const { errors, payload } = parseLitterInput(
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

    const litter = await updateLitter(payload, admin.principal);

    if (!litter) {
      return json(
        {
          ok: false,
          error: "Litter not found."
        },
        { status: 404 }
      );
    }

    context.log("Updated litter", {
      litterId: litter.id,
      userId: admin.principal.userId ?? null
    });

    return json({
      ok: true,
      litter
    });
  }
});
