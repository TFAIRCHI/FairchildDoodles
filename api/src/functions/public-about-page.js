const { app } = require("@azure/functions");
const { json } = require("../shared/response");
const { getMappedValue, getPageContentMap } = require("../shared/public-content");
const { getSectionImages } = require("../shared/images");

function toImageModel(image, fallbackAlt) {
  return {
    id: image.id,
    src: image.imageUrl,
    alt: image.altText || fallbackAlt || image.originalFileName || "Site image",
    caption: image.caption || ""
  };
}

app.http("public-about-page", {
  route: "public/about-page",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async () => {
    const content = await getPageContentMap("about");
    const storyImages = (await getSectionImages("about.story.image")).filter((image) => image.isActive && image.imageUrl);
    const parentsCarouselImages = (await getSectionImages("about.parents.carousel")).filter((image) => image.isActive && image.imageUrl);

    return json({
      ok: true,
      page: {
        headerTitle: getMappedValue(content, "header.title", "About Us"),
        headerSubtitle: getMappedValue(content, "header.subtitle", "The story behind Fairchild Doodles"),
        storyTitle: getMappedValue(content, "story.title", "Our Story"),
        storyParagraphs: [
          getMappedValue(content, "story.paragraph1", "Fairchild Doodles started as a dream born from a deep love of dogs. What began as a family passion quickly grew into a mission — to bring thoughtfully bred, healthy, and well-socialized Doodles into the lives of loving families."),
          getMappedValue(content, "story.paragraph2", "We are not a large-scale operation. We are a small, family-run breeder based right here in our community, where every puppy is whelped, raised, and cared for under our direct supervision. That means each litter gets the individual attention it deserves."),
          getMappedValue(content, "story.paragraph3", "Over the years, we have refined our breeding program with one goal in mind: producing puppies that are not only beautiful, but healthy, confident, and eager to bond with their new families."),
          getMappedValue(content, "story.paragraph4", "")
        ].filter(Boolean),
        storyImage: storyImages.length ? toImageModel(storyImages[0], "Our family with our doodles") : null,
        parentsSectionTitle: getMappedValue(content, "parents.sectionTitle", "Meet the Parents"),
        parentsSectionSubtitle: getMappedValue(content, "parents.sectionSubtitle", "The loving dogs behind our Doodle puppies"),
        parentsCarouselImages: parentsCarouselImages.map((image) => toImageModel(image, "Parent or puppy portrait")),
        parentsCardTitle: getMappedValue(content, "parents.cardTitle", "Meet Sadie & Bronco"),
        parentsCardSummary: getMappedValue(content, "parents.cardSummary", "Our parent pair brings together affectionate, family‑friendly temperaments and beautiful, soft coats."),
        sadieName: getMappedValue(content, "parents.sadieName", "Sadie"),
        sadieDescription: getMappedValue(content, "parents.sadieDescription", "Gentle, calm, and incredibly loving. She is a patient companion and a wonderful mom."),
        broncoName: getMappedValue(content, "parents.broncoName", "Bronco"),
        broncoDescription: getMappedValue(content, "parents.broncoDescription", "Playful, confident, and eager to please. He adds joyful energy and intelligence to every litter."),
        ctaTitle: getMappedValue(content, "cta.title", "Interested in bringing a Doodle home?"),
        ctaBody: getMappedValue(content, "cta.body", "Browse our available puppies or reach out with any questions"),
        ctaPrimaryLabel: getMappedValue(content, "cta.primaryLabel", "VIEW PUPPIES"),
        ctaSecondaryLabel: getMappedValue(content, "cta.secondaryLabel", "CONTACT US")
      }
    });
  }
});
