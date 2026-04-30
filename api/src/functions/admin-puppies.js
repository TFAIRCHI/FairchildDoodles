const { app } = require("@azure/functions");
const { requireAdmin } = require("../shared/admin");
const { json } = require("../shared/response");
const { getLitterById } = require("../shared/litters");
const {
  createPuppy,
  getPuppyById,
  listPuppies,
  parsePuppyInput,
  updatePuppy
} = require("../shared/puppies");

async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function ensureLitterExists(litterId) {
  const litter = await getLitterById(litterId);
  return Boolean(litter);
}

app.http("admin-puppies-list-create", {
  route: "manage/puppies",
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const admin = requireAdmin(request);

    if (!admin.ok) {
      return admin.response;
    }

    if (request.method === "GET") {
      const litterId = request.query.get("litterId")?.trim() ?? "";
      const puppies = await listPuppies({ litterId });

      return json({
        ok: true,
        puppies
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

    const { errors, payload } = parsePuppyInput(body, "create");

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

    if (!(await ensureLitterExists(payload.litterId))) {
      return json(
        {
          ok: false,
          error: "The provided litterId does not exist."
        },
        { status: 400 }
      );
    }

    const puppy = await createPuppy(payload, admin.principal);

    context.log("Created puppy", {
      puppyId: puppy.id,
      litterId: puppy.litterId,
      userId: admin.principal.userId ?? null
    });

    return json(
      {
        ok: true,
        puppy
      },
      { status: 201 }
    );
  }
});

app.http("admin-puppies-detail-update", {
  route: "manage/puppies/{id}",
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
          error: "A puppy id is required."
        },
        { status: 400 }
      );
    }

    if (request.method === "GET") {
      const puppy = await getPuppyById(id);

      if (!puppy) {
        return json(
          {
            ok: false,
            error: "Puppy not found."
          },
          { status: 404 }
        );
      }

      return json({
        ok: true,
        puppy
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

    const { errors, payload } = parsePuppyInput(
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

    if (!(await ensureLitterExists(payload.litterId))) {
      return json(
        {
          ok: false,
          error: "The provided litterId does not exist."
        },
        { status: 400 }
      );
    }

    const puppy = await updatePuppy(payload, admin.principal);

    if (!puppy) {
      return json(
        {
          ok: false,
          error: "Puppy not found."
        },
        { status: 404 }
      );
    }

    context.log("Updated puppy", {
      puppyId: puppy.id,
      litterId: puppy.litterId,
      userId: admin.principal.userId ?? null
    });

    return json({
      ok: true,
      puppy
    });
  }
});
