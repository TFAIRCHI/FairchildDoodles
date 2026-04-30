const { app } = require("@azure/functions");
const { json } = require("../shared/response");
const { getMappedValue, getPageContentMap } = require("../shared/public-content");

function buildStep(content, index, defaultTitle, defaultDescription) {
  return {
    number: index,
    title: getMappedValue(content, `expectations.step${index}Title`, defaultTitle),
    description: getMappedValue(content, `expectations.step${index}Description`, defaultDescription)
  };
}

app.http("public-contact-page", {
  route: "public/contact-page",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async () => {
    const content = await getPageContentMap("contact");

    return json({
      ok: true,
      page: {
        headerTitle: getMappedValue(content, "header.title", "Contact Us"),
        headerSubtitle: getMappedValue(content, "header.subtitle", "We'd love to hear from you"),
        contactCardTitle: getMappedValue(content, "contact.title", "Get In Touch"),
        contactLocationLabel: getMappedValue(content, "contact.locationLabel", "Location"),
        contactLocationValue: getMappedValue(content, "contact.locationValue", "Fairchild Doodles<br>North Augusta, South Carolina"),
        contactEmailLabel: getMappedValue(content, "contact.emailLabel", "Email"),
        contactEmailValue: getMappedValue(content, "contact.emailValue", "stricklandlauren11@gmail.com"),
        contactPhoneLabel: getMappedValue(content, "contact.phoneLabel", "Phone"),
        contactPhoneValue: getMappedValue(content, "contact.phoneValue", "706-836-8183"),
        contactResponseLabel: getMappedValue(content, "contact.responseLabel", "Response Time"),
        contactResponseValue: getMappedValue(content, "contact.responseValue", "We typically reply within 24 hours"),
        expectationsTitle: getMappedValue(content, "expectations.title", "What to Expect"),
        expectations: [
          buildStep(content, 1, "Puppies go home at 8 weeks old", "We focus on early socialization and healthy development."),
          buildStep(content, 2, "$500 non‑refundable deposit", "Required at selection to reserve your puppy."),
          buildStep(content, 3, "Contract signed at first visit", "We review care expectations and answer questions."),
          buildStep(content, 4, "Puppy goes home with a blanket", "Comfort item with familiar scent."),
          buildStep(content, 5, "Vaccines & deworming", "1 puppy vaccine and 3 rounds of dewormer completed."),
          buildStep(content, 6, "Health records at pickup", "We provide vaccine and vet documentation."),
          buildStep(content, 7, "Ongoing updates", "We post updates on Facebook and send personal updates.")
        ]
      }
    });
  }
});
