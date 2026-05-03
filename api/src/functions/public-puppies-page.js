const { app } = require("@azure/functions");
const { json } = require("../shared/response");
const { getCurrentActiveLitter } = require("../shared/litters");
const { listPuppies } = require("../shared/puppies");
const { listImages } = require("../shared/images");
const { buildBannerText, buildHeaderSubtitle, formatDisplayDate } = require("../shared/public-litter");

function mapPuppyCard(puppy, litter, images) {
  const sortedImages = [...images].sort((left, right) => {
    const leftOrder = left.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.displayOrder ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.originalFileName.localeCompare(right.originalFileName);
  });

  return {
    id: puppy.id,
    displayName: puppy.displayName,
    gender: puppy.gender,
    colorLabel: puppy.colorLabel,
    price: puppy.price,
    availabilityStatus: puppy.availabilityStatus,
    shortSummary: puppy.shortSummary,
    longDescription: puppy.longDescription,
    featuredImageId: puppy.featuredImageId,
    displayOrder: puppy.displayOrder,
    isActive: puppy.isActive,
    litterBirthDate: litter.birthDate,
    litterBirthDateLabel: formatDisplayDate(litter.birthDate),
    images: sortedImages.map((image) => ({
      id: image.id,
      src: image.imageUrl,
      alt: image.altText || `${puppy.displayName} photo`,
      weekLabel: image.weekLabel || ""
    }))
  };
}

app.http("public-puppies-page", {
  route: "public/puppies-page",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async () => {
    const litter = await getCurrentActiveLitter();

    if (!litter) {
      return json({
        ok: true,
        page: {
          headerTitle: "Available Puppies",
          headerSubtitle: "No active litter is currently published.",
          infoLabel: "Current Litter",
          infoTitle: "Meet the Puppies",
          infoBody: "Check back soon for updates on the next litter.",
          bannerText: "",
          ctaTitle: "Questions about upcoming litters?",
          ctaBody: "Reach out anytime and we’ll be happy to help.",
          ctaButtonLabel: "CONTACT US",
          puppies: []
        }
      });
    }

    const puppies = (await listPuppies({ litterId: litter.id })).filter((puppy) => puppy.isActive);
    const puppyCards = [];

    for (const puppy of puppies) {
      const images = (await listImages({
        ownerType: "puppy",
        ownerId: puppy.id
      })).filter((image) => image.isActive && image.imageUrl);

      puppyCards.push(mapPuppyCard(puppy, litter, images));
    }

    return json({
      ok: true,
      page: {
        headerTitle: "Available Puppies",
        headerSubtitle: buildHeaderSubtitle(litter),
        infoLabel: "Current Litter",
        infoTitle: litter.title || "Meet the Puppies",
        infoBody: litter.summaryText || "Each puppy card includes current status, pricing, and photo updates.",
        bannerText: buildBannerText(litter),
        ctaTitle: "Questions about this litter?",
        ctaBody: "Reach out anytime and we’ll be happy to help.",
        ctaButtonLabel: "CONTACT US",
        puppies: puppyCards
      }
    });
  }
});
