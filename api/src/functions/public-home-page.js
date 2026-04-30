const { app } = require("@azure/functions");
const { json } = require("../shared/response");
const { getSectionImages } = require("../shared/images");

function toImageModel(image, fallbackAlt) {
  return {
    id: image.id,
    src: image.imageUrl,
    alt: image.altText || fallbackAlt || image.originalFileName || "Site image",
    caption: image.caption || ""
  };
}

app.http("public-home-page", {
  route: "public/home-page",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async () => {
    const aboutPreviewImages = (await getSectionImages("home.aboutPreview.image")).filter((image) => image.isActive && image.imageUrl);
    const parentsCarouselImages = (await getSectionImages("home.parents.carousel")).filter((image) => image.isActive && image.imageUrl);

    return json({
      ok: true,
      page: {
        aboutPreviewImage: aboutPreviewImages.length ? toImageModel(aboutPreviewImages[0], "Our family with our Doodles") : null,
        parentsCarouselImages: parentsCarouselImages.map((image) => toImageModel(image, "Parent or puppy portrait"))
      }
    });
  }
});
