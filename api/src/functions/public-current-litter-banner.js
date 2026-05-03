const { app } = require("@azure/functions");
const { json } = require("../shared/response");
const { getCurrentActiveLitter } = require("../shared/litters");
const { buildBannerText } = require("../shared/public-litter");

app.http("public-current-litter-banner", {
  route: "public/current-litter-banner",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async () => {
    const litter = await getCurrentActiveLitter();

    if (!litter) {
      return json({
        ok: true,
        banner: {
          isVisible: false,
          text: "",
          ctaLabel: "VIEW PUPPIES",
          ctaHref: "/puppies.html"
        }
      });
    }

    return json({
      ok: true,
      banner: {
        isVisible: Boolean(buildBannerText(litter)),
        text: buildBannerText(litter),
        ctaLabel: "VIEW PUPPIES",
        ctaHref: "/puppies.html",
        litterId: litter.id,
        litterTitle: litter.title || ""
      }
    });
  }
});
