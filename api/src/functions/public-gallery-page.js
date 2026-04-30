const { app } = require("@azure/functions");
const { json } = require("../shared/response");
const { listImages } = require("../shared/images");

app.http("public-gallery-page", {
  route: "public/gallery-page",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async () => {
    const images = (await listImages({ ownerType: "gallery" })).filter((image) => image.isActive && image.imageUrl);

    return json({
      ok: true,
      page: {
        headerTitle: "Puppy Gallery",
        headerSubtitle: "Browse our favorite moments and adorable memories",
        sectionTitle: "Previous Litters",
        sectionSubtitle: "Click any photo to view it larger and browse through the gallery",
        items: images.map((image) => ({
          id: image.id,
          src: image.imageUrl,
          alt: image.altText || image.originalFileName || "Gallery image",
          caption: image.caption || "",
          displayOrder: image.displayOrder
        }))
      }
    });
  }
});
