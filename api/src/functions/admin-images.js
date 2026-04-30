const { app } = require("@azure/functions");
const { requireAdmin } = require("../shared/admin");
const { json } = require("../shared/response");
const {
  getImageById,
  listImages,
  parseImageMetadataInput,
  parseImageUploadInput,
  updateImageMetadata,
  uploadImageAndCreateRecord
} = require("../shared/images");

async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

app.http("admin-images-list-upload", {
  route: "manage/images",
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const admin = requireAdmin(request);

    if (!admin.ok) {
      return admin.response;
    }

    if (request.method === "GET") {
      const images = await listImages({
        ownerType: request.query.get("ownerType")?.trim() ?? "",
        ownerId: request.query.get("ownerId")?.trim() ?? "",
        sectionKey: request.query.get("sectionKey")?.trim() ?? ""
      });

      return json({
        ok: true,
        images
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

    const { errors, payload } = parseImageUploadInput(body);

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

    const image = await uploadImageAndCreateRecord(payload, admin.principal);

    context.log("Uploaded image", {
      imageId: image.id,
      ownerType: image.ownerType,
      ownerId: image.ownerId,
      userId: admin.principal.userId ?? null
    });

    return json(
      {
        ok: true,
        image
      },
      { status: 201 }
    );
  }
});

app.http("admin-images-detail-update", {
  route: "manage/images/{id}",
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
          error: "An image id is required."
        },
        { status: 400 }
      );
    }

    if (request.method === "GET") {
      const image = await getImageById(id);

      if (!image) {
        return json(
          {
            ok: false,
            error: "Image not found."
          },
          { status: 404 }
        );
      }

      return json({
        ok: true,
        image
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

    const { errors, payload } = parseImageMetadataInput({
      ...body,
      id
    });

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

    const image = await updateImageMetadata(payload, admin.principal);

    if (!image) {
      return json(
        {
          ok: false,
          error: "Image not found."
        },
        { status: 404 }
      );
    }

    context.log("Updated image metadata", {
      imageId: image.id,
      userId: admin.principal.userId ?? null
    });

    return json({
      ok: true,
      image
    });
  }
});
