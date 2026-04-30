const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { getContainerClient } = require("../src/shared/blob");
const { getTableClients } = require("../src/shared/tables");

const apiRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(apiRoot, "..");

loadLocalSettings();

const tableClients = getTableClients();
const containers = {
  puppy: getContainerClient(process.env.BLOB_CONTAINER_PUPPY_IMAGES),
  gallery: getContainerClient(process.env.BLOB_CONTAINER_GALLERY_IMAGES),
  site: getContainerClient(process.env.BLOB_CONTAINER_SITE_IMAGES)
};

const litterId = "born-2026-02-05";
const principal = "seed-script";
const now = new Date().toISOString();
const aboutStoryImagePath = "Pictures/FamilyPortraits/Family_Portraits.PNG";

const litterDefinition = {
  id: litterId,
  title: "Sadie & Bronco Winter 2026 Litter",
  birthDate: "2026-02-05",
  readyDate: "2026-04-02",
  status: "active",
  bannerText: "Puppies are here and available now. Ready for new homes by April 2nd. Visit the Puppies page for current photo updates and availability.",
  summaryText: "Meet Sadie and Bronco's February 2026 litter. Each puppy card includes weekly photo updates and current availability.",
  defaultMalePrice: null,
  defaultFemalePrice: null,
  displayOrder: 1,
  isActive: true
};

const puppyDefinitions = [
  {
    id: "puppy-green-bow-boy",
    displayName: "Green Bow Boy",
    gender: "male",
    colorLabel: "Green Bow",
    shortSummary: "Calm expression, rich apricot coloring, and weekly photo updates from the current litter.",
    longDescription: "Green Bow Boy is part of Sadie and Bronco's current litter and is shown here with his first three weeks of photo updates.",
    displayOrder: 1
  },
  {
    id: "puppy-orange-bow-boy",
    displayName: "Orange Bow Boy",
    gender: "male",
    colorLabel: "Orange Bow",
    shortSummary: "Warm coloring and a bright, alert face captured across the first three weekly update sets.",
    longDescription: "Orange Bow Boy has multiple photo updates from the current litter so families can follow his early growth week by week.",
    displayOrder: 2
  },
  {
    id: "puppy-red-bow-boy",
    displayName: "Red Bow Boy",
    gender: "male",
    colorLabel: "Red Bow",
    shortSummary: "A handsome boy from the current litter with week-by-week portraits through the first three weeks.",
    longDescription: "Red Bow Boy is one of the current male puppies and includes multiple early-life photo updates for browsing families.",
    displayOrder: 3
  },
  {
    id: "puppy-pink-bow-girl",
    displayName: "Pink Bow Girl",
    gender: "female",
    colorLabel: "Pink Bow",
    shortSummary: "A soft-coated girl from the February 2026 litter with consistent weekly progress photos.",
    longDescription: "Pink Bow Girl is shown with multiple weekly portraits so visitors can see her development across the first three weeks.",
    displayOrder: 4
  },
  {
    id: "puppy-purple-bow-girl",
    displayName: "Purple Bow Girl",
    gender: "female",
    colorLabel: "Purple Bow",
    shortSummary: "Sweet expression and documented weekly photo updates from the current active litter.",
    longDescription: "Purple Bow Girl is part of the current litter and includes multiple photo sets to help families compare the puppies.",
    displayOrder: 5
  },
  {
    id: "puppy-yellow-bow-girl",
    displayName: "Yellow Bow Girl",
    gender: "female",
    colorLabel: "Yellow Bow",
    shortSummary: "Bright little girl with an active set of weekly puppy portraits from weeks one through three.",
    longDescription: "Yellow Bow Girl's listing includes multiple weekly images so the public site reflects the latest available litter content.",
    displayOrder: 6
  }
];

const aboutTextBlocks = [
  ["header", "title", "Header Title", "About Us"],
  ["header", "subtitle", "Header Subtitle", "The story behind Fairchild Doodles"],
  ["story", "title", "Story Section Title", "Our Story"],
  ["story", "paragraph1", "Story Paragraph 1", "Fairchild Doodles started as a dream born from a deep love of dogs. What began as a family passion quickly grew into a mission — to bring thoughtfully bred, healthy, and well-socialized Doodles into the lives of loving families."],
  ["story", "paragraph2", "Story Paragraph 2", "We are not a large-scale operation. We are a small, family-run breeder based right here in our community, where every puppy is whelped, raised, and cared for under our direct supervision. That means each litter gets the individual attention it deserves."],
  ["story", "paragraph3", "Story Paragraph 3", "Over the years, we have refined our breeding program with one goal in mind: producing puppies that are not only beautiful, but healthy, confident, and eager to bond with their new families."],
  ["story", "paragraph4", "Story Paragraph 4", ""],
  ["parents", "sectionTitle", "Parents Section Title", "Meet the Parents"],
  ["parents", "sectionSubtitle", "Parents Section Subtitle", "The loving dogs behind our Doodle puppies"],
  ["parents", "cardTitle", "Parents Card Title", "Meet Sadie & Bronco"],
  ["parents", "cardSummary", "Parents Card Summary", "Our parent pair brings together affectionate, family-friendly temperaments and beautiful, soft coats."],
  ["parents", "sadieName", "Sadie Name", "Sadie"],
  ["parents", "sadieDescription", "Sadie Description", "Gentle, calm, and incredibly loving. She is a patient companion and a wonderful mom."],
  ["parents", "broncoName", "Bronco Name", "Bronco"],
  ["parents", "broncoDescription", "Bronco Description", "Playful, confident, and eager to please. He adds joyful energy and intelligence to every litter."],
  ["cta", "title", "CTA Title", "Interested in bringing a Doodle home?"],
  ["cta", "body", "CTA Body", "Browse our available puppies or reach out with any questions"],
  ["cta", "primaryLabel", "Primary CTA Label", "VIEW PUPPIES"],
  ["cta", "secondaryLabel", "Secondary CTA Label", "CONTACT US"]
];

const contactTextBlocks = [
  ["header", "title", "Header Title", "Contact Us"],
  ["header", "subtitle", "Header Subtitle", "We'd love to hear from you"],
  ["contact", "title", "Contact Card Title", "Get In Touch"],
  ["contact", "locationLabel", "Location Label", "Location"],
  ["contact", "locationValue", "Location Value", "Fairchild Doodles<br>North Augusta, South Carolina"],
  ["contact", "emailLabel", "Email Label", "Email"],
  ["contact", "emailValue", "Email Value", "stricklandlauren11@gmail.com"],
  ["contact", "phoneLabel", "Phone Label", "Phone"],
  ["contact", "phoneValue", "Phone Value", "706-836-8183"],
  ["contact", "responseLabel", "Response Time Label", "Response Time"],
  ["contact", "responseValue", "Response Time Value", "We typically reply within 24 hours"],
  ["expectations", "title", "Expectations Section Title", "What to Expect"],
  ["expectations", "step1Title", "Step 1 Title", "Puppies go home at 8 weeks old"],
  ["expectations", "step1Description", "Step 1 Description", "We focus on early socialization and healthy development."],
  ["expectations", "step2Title", "Step 2 Title", "$500 non-refundable deposit"],
  ["expectations", "step2Description", "Step 2 Description", "Required at selection to reserve your puppy."],
  ["expectations", "step3Title", "Step 3 Title", "Contract signed at first visit"],
  ["expectations", "step3Description", "Step 3 Description", "We review care expectations and answer questions."],
  ["expectations", "step4Title", "Step 4 Title", "Puppy goes home with a blanket"],
  ["expectations", "step4Description", "Step 4 Description", "Comfort item with familiar scent."],
  ["expectations", "step5Title", "Step 5 Title", "Vaccines & deworming"],
  ["expectations", "step5Description", "Step 5 Description", "1 puppy vaccine and 3 rounds of dewormer completed."],
  ["expectations", "step6Title", "Step 6 Title", "Health records at pickup"],
  ["expectations", "step6Description", "Step 6 Description", "We provide vaccine and vet documentation."],
  ["expectations", "step7Title", "Step 7 Title", "Ongoing updates"],
  ["expectations", "step7Description", "Step 7 Description", "We post updates on Facebook and send personal updates."]
];

const siteSectionImages = [
  {
    key: "home.aboutPreview.image",
    source: aboutStoryImagePath,
    caption: "Our Family",
    altText: "Our family with our Doodles"
  },
  {
    key: "about.story.image",
    source: aboutStoryImagePath,
    caption: "Our Family",
    altText: "Our family with our doodles"
  },
  {
    key: "home.parents.carousel",
    source: "Pictures/parents-carousel/Sadie_Bronco_Parents.jpg",
    caption: "Sadie & Bronco",
    altText: "Sadie and Bronco together"
  },
  {
    key: "home.parents.carousel",
    source: "Pictures/parents-carousel/Sadie_Mom.jpg",
    caption: "Sadie",
    altText: "Sadie, the mother of the litter"
  },
  {
    key: "home.parents.carousel",
    source: "Pictures/parents-carousel/Bronco_Father.jpg",
    caption: "Bronco",
    altText: "Bronco, the father of the litter"
  },
  {
    key: "home.parents.carousel",
    source: "Pictures/parents-carousel/original-AFC5F5D5-39CA-4D39-AC40-B760E04F9577.jpeg",
    caption: "Puppy Portrait",
    altText: "Doodle puppy portrait"
  },
  {
    key: "home.parents.carousel",
    source: "Pictures/parents-carousel/original-6F7551DF-AF3C-43FC-BF95-5477152898D0.jpeg",
    caption: "Puppy Portrait",
    altText: "Doodle puppy portrait"
  },
  {
    key: "home.parents.carousel",
    source: "Pictures/parents-carousel/original-EA763526-4297-4036-92ED-B0B3A27AD8FE.jpeg",
    caption: "Puppy Portrait",
    altText: "Doodle puppy portrait"
  },
  {
    key: "home.parents.carousel",
    source: "Pictures/parents-carousel/Sadie_bronco_Christmas.jpeg",
    caption: "Holiday Portrait",
    altText: "Sadie and Bronco at Christmas"
  },
  {
    key: "home.parents.carousel",
    source: "Pictures/parents-carousel/Sadie_As_Pup.jpg",
    caption: "Sadie as a Pup",
    altText: "Sadie as a puppy"
  },
  {
    key: "about.parents.carousel",
    source: "Pictures/parents-carousel/Sadie_Bronco_Parents.jpg",
    caption: "Sadie & Bronco",
    altText: "Sadie and Bronco together"
  },
  {
    key: "about.parents.carousel",
    source: "Pictures/parents-carousel/Sadie_Mom.jpg",
    caption: "Sadie",
    altText: "Sadie, the mother of the litter"
  },
  {
    key: "about.parents.carousel",
    source: "Pictures/parents-carousel/Bronco_Father.jpg",
    caption: "Bronco",
    altText: "Bronco, the father of the litter"
  },
  {
    key: "about.parents.carousel",
    source: "Pictures/parents-carousel/original-AFC5F5D5-39CA-4D39-AC40-B760E04F9577.jpeg",
    caption: "Puppy Portrait",
    altText: "Doodle puppy portrait"
  },
  {
    key: "about.parents.carousel",
    source: "Pictures/parents-carousel/original-6F7551DF-AF3C-43FC-BF95-5477152898D0.jpeg",
    caption: "Puppy Portrait",
    altText: "Doodle puppy portrait"
  },
  {
    key: "about.parents.carousel",
    source: "Pictures/parents-carousel/original-EA763526-4297-4036-92ED-B0B3A27AD8FE.jpeg",
    caption: "Puppy Portrait",
    altText: "Doodle puppy portrait"
  },
  {
    key: "about.parents.carousel",
    source: "Pictures/parents-carousel/Sadie_bronco_Christmas.jpeg",
    caption: "Holiday Portrait",
    altText: "Sadie and Bronco at Christmas"
  },
  {
    key: "about.parents.carousel",
    source: "Pictures/parents-carousel/Sadie_As_Pup.jpg",
    caption: "Sadie as a Pup",
    altText: "Sadie as a puppy"
  }
];

async function main() {
  console.log("Starting content seed...");

  await ensureContainersReady();
  await seedLitter();
  await seedPuppies();
  await seedAboutContent();
  await seedContactContent();
  await seedSiteSectionImages();
  await seedGalleryImages();

  console.log("Content seed complete.");
}

function loadLocalSettings() {
  const localSettingsPath = path.join(apiRoot, "local.settings.json");

  if (!fs.existsSync(localSettingsPath)) {
    return;
  }

  const raw = fs.readFileSync(localSettingsPath, "utf8");
  const parsed = JSON.parse(raw);
  const values = parsed.Values ?? {};

  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === undefined) {
      process.env[key] = String(value);
    }
  }
}

function buildSeedId(prefix, key) {
  return `${prefix}-${crypto.createHash("sha1").update(key).digest("hex")}`;
}

function getMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "application/octet-stream";
}

function toRepoPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

async function ensureContainersReady() {
  for (const container of Object.values(containers)) {
    await container.createIfNotExists();
  }
}

async function upsertEntity(client, entity) {
  await client.upsertEntity(entity, "Replace");
}

async function seedLitter() {
  const entity = {
    partitionKey: "litter",
    rowKey: litterDefinition.id,
    ...litterDefinition,
    createdAt: now,
    updatedAt: now,
    updatedBy: principal
  };

  await upsertEntity(tableClients.litters, entity);
  console.log(`Seeded litter: ${litterDefinition.title}`);
}

async function seedPuppies() {
  for (const puppy of puppyDefinitions) {
    const entity = {
      partitionKey: "puppy",
      rowKey: puppy.id,
      litterId,
      displayName: puppy.displayName,
      gender: puppy.gender,
      colorLabel: puppy.colorLabel,
      price: null,
      availabilityStatus: "available",
      shortSummary: puppy.shortSummary,
      longDescription: puppy.longDescription,
      featuredImageId: "",
      displayOrder: puppy.displayOrder,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      updatedBy: principal
    };

    await upsertEntity(tableClients.puppies, entity);
    await seedPuppyImages(puppy);
    console.log(`Seeded puppy: ${puppy.displayName}`);
  }
}

async function seedPuppyImages(puppy) {
  const puppyFolder = path.join(repoRoot, "Pictures", "Recent_Litters", "Born_20260205");
  const files = fs.readdirSync(puppyFolder)
    .filter((fileName) => fileName.includes(getPuppyFileStem(puppy.id)))
    .filter((fileName) => /\.(jpg|jpeg|png)$/i.test(fileName))
    .sort(sortWeekFiles);

  for (let index = 0; index < files.length; index += 1) {
    const fileName = files[index];
    const relativePath = path.join("Pictures", "Recent_Litters", "Born_20260205", fileName);
    const imageId = buildSeedId("image", `${puppy.id}:${relativePath}`);
    const blobName = `puppy/${puppy.id}/${fileName}`;
    const weekLabel = extractWeekLabel(fileName);
    const sourcePath = toRepoPath(relativePath);
    await uploadImageRecord({
      id: imageId,
      container: containers.puppy,
      blobName,
      sourcePath,
      ownerType: "puppy",
      ownerId: puppy.id,
      contentType: getMimeType(sourcePath),
      originalFileName: fileName,
      altText: `${puppy.displayName} ${weekLabel}`.trim(),
      caption: "",
      weekLabel,
      sectionKey: "",
      displayOrder: index + 1,
      isActive: true,
      featured: false
    });
  }
}

function getPuppyFileStem(puppyId) {
  const map = {
    "puppy-green-bow-boy": "Boy_GreenBow",
    "puppy-orange-bow-boy": "Boy_OrangeBow",
    "puppy-red-bow-boy": "Boy_RedBow",
    "puppy-pink-bow-girl": "Girl_PinkBow",
    "puppy-purple-bow-girl": "Girl_PurpleBow",
    "puppy-yellow-bow-girl": "Girl_YellowBow"
  };

  return map[puppyId];
}

function sortWeekFiles(left, right) {
  const leftMatch = left.match(/_(\d+)_Week(\d+)/i);
  const rightMatch = right.match(/_(\d+)_Week(\d+)/i);

  const leftPose = leftMatch ? Number(leftMatch[1]) : Number.MAX_SAFE_INTEGER;
  const rightPose = rightMatch ? Number(rightMatch[1]) : Number.MAX_SAFE_INTEGER;
  const leftWeek = leftMatch ? Number(leftMatch[2]) : Number.MAX_SAFE_INTEGER;
  const rightWeek = rightMatch ? Number(rightMatch[2]) : Number.MAX_SAFE_INTEGER;

  if (leftWeek !== rightWeek) {
    return leftWeek - rightWeek;
  }

  if (leftPose !== rightPose) {
    return leftPose - rightPose;
  }

  return left.localeCompare(right);
}

function extractWeekLabel(fileName) {
  const match = fileName.match(/Week(\d+)/i);

  if (!match) {
    return "";
  }

  return `Week ${match[1]}`;
}

async function seedAboutContent() {
  for (let index = 0; index < aboutTextBlocks.length; index += 1) {
    const [sectionKey, fieldKey, fieldLabel, contentValue] = aboutTextBlocks[index];
    await seedTextBlock({
      pageKey: "about",
      sectionKey,
      fieldKey,
      fieldLabel,
      contentValue,
      displayOrder: index + 1
    });
  }

  console.log("Seeded About page content.");
}

async function seedContactContent() {
  for (let index = 0; index < contactTextBlocks.length; index += 1) {
    const [sectionKey, fieldKey, fieldLabel, contentValue] = contactTextBlocks[index];
    await seedTextBlock({
      pageKey: "contact",
      sectionKey,
      fieldKey,
      fieldLabel,
      contentValue,
      displayOrder: index + 1
    });
  }

  console.log("Seeded Contact page content.");
}

async function seedTextBlock({ pageKey, sectionKey, fieldKey, fieldLabel, contentValue, displayOrder }) {
  const id = buildSeedId("text", `${pageKey}:${sectionKey}:${fieldKey}`);
  const entity = {
    partitionKey: "textblock",
    rowKey: id,
    pageKey,
    sectionKey,
    fieldKey,
    fieldLabel,
    contentValue,
    inputType: "textarea",
    displayOrder,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    updatedBy: principal
  };

  await upsertEntity(tableClients.textBlocks, entity);
}

async function seedSiteSectionImages() {
  for (let index = 0; index < siteSectionImages.length; index += 1) {
    const image = siteSectionImages[index];
    const fileName = path.basename(image.source);
    const imageId = buildSeedId("image", `${image.key}:${image.source}`);
    const sourcePath = toRepoPath(image.source);
    const blobName = `site-section/${image.key.replace(/[^a-zA-Z0-9._-]/g, "_")}/${fileName}`;

    await uploadImageRecord({
      id: imageId,
      container: containers.site,
      blobName,
      sourcePath,
      ownerType: "site-section",
      ownerId: "",
      contentType: getMimeType(sourcePath),
      originalFileName: fileName,
      altText: image.altText,
      caption: image.caption,
      weekLabel: "",
      sectionKey: image.key,
      displayOrder: index + 1,
      isActive: true,
      featured: false
    });
  }

  console.log("Seeded site-section images.");
}

async function seedGalleryImages() {
  const manifestPath = toRepoPath(path.join("Pictures", "puppy-gallery", "manifest.json"));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  for (let index = 0; index < manifest.length; index += 1) {
    const item = manifest[index];
    const relativePath = item.src.replace(/\//g, path.sep);
    const sourcePath = toRepoPath(relativePath);

    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    const fileName = path.basename(sourcePath);
    const imageId = buildSeedId("image", `gallery:${relativePath}`);
    const altText = normalizeGalleryAlt(item.alt || fileName);

    await uploadImageRecord({
      id: imageId,
      container: containers.gallery,
      blobName: `gallery/${fileName}`,
      sourcePath,
      ownerType: "gallery",
      ownerId: "",
      contentType: getMimeType(sourcePath),
      originalFileName: fileName,
      altText,
      caption: "",
      weekLabel: "",
      sectionKey: "",
      displayOrder: index + 1,
      isActive: true,
      featured: false
    });
  }

  console.log(`Seeded gallery images: ${manifest.length}`);
}

function normalizeGalleryAlt(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function uploadImageRecord({
  id,
  container,
  blobName,
  sourcePath,
  ownerType,
  ownerId,
  contentType,
  originalFileName,
  altText,
  caption,
  weekLabel,
  sectionKey,
  displayOrder,
  isActive,
  featured
}) {
  const binary = fs.readFileSync(sourcePath);
  const blobClient = container.getBlockBlobClient(blobName);

  await blobClient.uploadData(binary, {
    blobHTTPHeaders: {
      blobContentType: contentType
    },
    overwrite: true
  });

  const entity = {
    partitionKey: "image",
    rowKey: id,
    ownerType,
    ownerId,
    containerName: container.containerName,
    blobName,
    storagePath: `${container.containerName}/${blobName}`,
    contentType,
    originalFileName,
    altText,
    caption,
    weekLabel,
    sectionKey,
    displayOrder,
    isActive,
    featured,
    sizeBytes: binary.byteLength,
    createdAt: now,
    updatedAt: now,
    updatedBy: principal
  };

  await upsertEntity(tableClients.images, entity);
}

main().catch((error) => {
  console.error("Content seed failed.");
  console.error(error);
  process.exitCode = 1;
});
