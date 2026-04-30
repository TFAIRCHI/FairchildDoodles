const crypto = require("node:crypto");
const path = require("node:path");
const { getBlobContainers, getBlobReadUrl, getContainerClient } = require("./blob");
const { getTableClients } = require("./tables");

const IMAGE_PARTITION_KEY = "image";
const ALLOWED_OWNER_TYPES = new Set(["puppy", "gallery", "site-section", "litter"]);

function normalizeString(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeOptionalString(value) {
  const normalized = normalizeString(value);
  return normalized || "";
}

function normalizeOptionalInteger(value, fieldName, errors) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalized = Number(value);

  if (!Number.isInteger(normalized) || normalized < 0) {
    errors.push(`${fieldName} must be a whole number or empty.`);
    return null;
  }

  return normalized;
}

function normalizeOptionalBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }

    if (value.toLowerCase() === "false") {
      return false;
    }
  }

  return false;
}

function sanitizeFileName(fileName) {
  const baseName = path.basename(fileName || "upload.bin");
  return baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function resolveContainerName(ownerType) {
  const containers = getBlobContainers();

  if (ownerType === "puppy") {
    return containers.puppyImages;
  }

  if (ownerType === "gallery") {
    return containers.galleryImages;
  }

  return containers.siteImages;
}

function buildBlobName(payload) {
  const fileName = sanitizeFileName(payload.fileName);
  const entityId = payload.ownerId || "unassigned";
  const uniqueSegment = `${Date.now()}-${crypto.randomUUID()}`;
  return `${payload.ownerType}/${entityId}/${uniqueSegment}-${fileName}`;
}

function parseImageUploadInput(input) {
  const errors = [];
  const ownerType = normalizeString(input.ownerType).toLowerCase();

  if (!ALLOWED_OWNER_TYPES.has(ownerType)) {
    errors.push("ownerType must be one of puppy, gallery, site-section, or litter.");
  }

  const fileName = normalizeString(input.fileName);

  if (!fileName) {
    errors.push("fileName is required.");
  }

  const contentType = normalizeString(input.contentType);

  if (!contentType) {
    errors.push("contentType is required.");
  }

  const base64Data = normalizeString(input.base64Data);

  if (!base64Data) {
    errors.push("base64Data is required.");
  }

  const ownerId = normalizeOptionalString(input.ownerId);

  if ((ownerType === "puppy" || ownerType === "litter") && !ownerId) {
    errors.push(`ownerId is required for ownerType ${ownerType}.`);
  }

  return {
    errors,
    payload: {
      ownerType,
      ownerId,
      fileName,
      contentType,
      base64Data,
      altText: normalizeOptionalString(input.altText),
      caption: normalizeOptionalString(input.caption),
      weekLabel: normalizeOptionalString(input.weekLabel),
      sectionKey: normalizeOptionalString(input.sectionKey),
      displayOrder: normalizeOptionalInteger(input.displayOrder, "displayOrder", errors),
      isActive: normalizeOptionalBoolean(input.isActive)
    }
  };
}

function parseImageMetadataInput(input, mode = "update") {
  const errors = [];
  const payload = {
    id: normalizeString(input.id),
    altText: normalizeOptionalString(input.altText),
    caption: normalizeOptionalString(input.caption),
    weekLabel: normalizeOptionalString(input.weekLabel),
    sectionKey: normalizeOptionalString(input.sectionKey),
    displayOrder: normalizeOptionalInteger(input.displayOrder, "displayOrder", errors),
    isActive: normalizeOptionalBoolean(input.isActive),
    featured: normalizeOptionalBoolean(input.featured)
  };

  if (mode === "update" && !payload.id) {
    errors.push("id is required.");
  }

  return { errors, payload };
}

function mapEntityToImage(entity) {
  return {
    id: entity.rowKey,
    ownerType: entity.ownerType ?? "",
    ownerId: entity.ownerId ?? "",
    containerName: entity.containerName ?? "",
    blobName: entity.blobName ?? "",
    storagePath: entity.storagePath ?? "",
    imageUrl: entity.containerName && entity.blobName ? getBlobReadUrl(entity.containerName, entity.blobName) : "",
    contentType: entity.contentType ?? "",
    originalFileName: entity.originalFileName ?? "",
    altText: entity.altText ?? "",
    caption: entity.caption ?? "",
    weekLabel: entity.weekLabel ?? "",
    sectionKey: entity.sectionKey ?? "",
    displayOrder: entity.displayOrder ?? null,
    isActive: Boolean(entity.isActive),
    featured: Boolean(entity.featured),
    sizeBytes: entity.sizeBytes ?? null,
    createdAt: entity.createdAt ?? "",
    updatedAt: entity.updatedAt ?? "",
    updatedBy: entity.updatedBy ?? ""
  };
}

async function uploadImageAndCreateRecord(payload, principal) {
  const containerName = resolveContainerName(payload.ownerType);
  const containerClient = getContainerClient(containerName);
  const blobName = buildBlobName(payload);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const binary = Buffer.from(payload.base64Data, "base64");
  const imageId = crypto.randomUUID();
  const now = new Date().toISOString();

  await blockBlobClient.uploadData(binary, {
    blobHTTPHeaders: {
      blobContentType: payload.contentType
    }
  });

  const entity = {
    partitionKey: IMAGE_PARTITION_KEY,
    rowKey: imageId,
    ownerType: payload.ownerType,
    ownerId: payload.ownerId,
    containerName,
    blobName,
    storagePath: `${containerName}/${blobName}`,
    contentType: payload.contentType,
    originalFileName: payload.fileName,
    altText: payload.altText,
    caption: payload.caption,
    weekLabel: payload.weekLabel,
    sectionKey: payload.sectionKey,
    displayOrder: payload.displayOrder,
    isActive: payload.isActive,
    featured: false,
    sizeBytes: binary.byteLength,
    createdAt: now,
    updatedAt: now,
    updatedBy: principal?.userDetails ?? ""
  };

  await getTableClients().images.createEntity(entity);
  return mapEntityToImage(entity);
}

async function listImages(options = {}) {
  const client = getTableClients().images;
  const filters = [`PartitionKey eq '${IMAGE_PARTITION_KEY}'`];

  if (options.ownerType) {
    filters.push(`ownerType eq '${options.ownerType.replace(/'/g, "''")}'`);
  }

  if (options.ownerId) {
    filters.push(`ownerId eq '${options.ownerId.replace(/'/g, "''")}'`);
  }

  if (options.sectionKey) {
    filters.push(`sectionKey eq '${options.sectionKey.replace(/'/g, "''")}'`);
  }

  const items = [];

  for await (const entity of client.listEntities({
    queryOptions: {
      filter: filters.join(" and ")
    }
  })) {
    items.push(mapEntityToImage(entity));
  }

  items.sort((left, right) => {
    const leftOrder = left.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.displayOrder ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.originalFileName.localeCompare(right.originalFileName);
  });

  return items;
}

async function getImageById(id) {
  try {
    const entity = await getTableClients().images.getEntity(IMAGE_PARTITION_KEY, id);
    return mapEntityToImage(entity);
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }

    throw error;
  }
}

async function getSectionImages(sectionKey) {
  return listImages({
    ownerType: "site-section",
    sectionKey
  });
}

async function updateImageMetadata(payload, principal) {
  const client = getTableClients().images;
  let existingEntity;

  try {
    existingEntity = await client.getEntity(IMAGE_PARTITION_KEY, payload.id);
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }

    throw error;
  }

  const entity = {
    ...existingEntity,
    altText: payload.altText,
    caption: payload.caption,
    weekLabel: payload.weekLabel,
    sectionKey: payload.sectionKey,
    displayOrder: payload.displayOrder,
    isActive: payload.isActive,
    featured: payload.featured,
    updatedAt: new Date().toISOString(),
    updatedBy: principal?.userDetails ?? ""
  };

  await client.updateEntity(entity, "Replace");
  return mapEntityToImage(entity);
}

module.exports = {
  getImageById,
  getSectionImages,
  listImages,
  parseImageMetadataInput,
  parseImageUploadInput,
  updateImageMetadata,
  uploadImageAndCreateRecord
};
