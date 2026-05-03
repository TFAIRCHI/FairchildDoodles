const crypto = require("node:crypto");
const { getTableClients } = require("./tables");

const LITTER_PARTITION_KEY = "litter";

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

function normalizeOptionalNumber(value, fieldName, errors) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalized = Number(value);

  if (!Number.isFinite(normalized) || normalized < 0) {
    errors.push(`${fieldName} must be a positive number or empty.`);
    return null;
  }

  return normalized;
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

function normalizeStatus(value) {
  const normalized = normalizeString(value).toLowerCase();
  const allowed = new Set(["active", "archived"]);

  if (!normalized) {
    return "active";
  }

  return allowed.has(normalized) ? normalized : "active";
}

function validateIsoDate(value, fieldName, errors) {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    return "";
  }

  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!isoDatePattern.test(normalized)) {
    errors.push(`${fieldName} must use YYYY-MM-DD format.`);
    return "";
  }

  return normalized;
}

function parseLitterInput(input, mode = "create") {
  const errors = [];
  const title = normalizeString(input.title);

  if (!title) {
    errors.push("title is required.");
  }

  const payload = {
    title,
    birthDate: validateIsoDate(input.birthDate, "birthDate", errors),
    readyDate: validateIsoDate(input.readyDate, "readyDate", errors),
    status: normalizeStatus(input.status),
    bannerText: normalizeOptionalString(input.bannerText),
    summaryText: normalizeOptionalString(input.summaryText),
    defaultMalePrice: normalizeOptionalNumber(input.defaultMalePrice, "defaultMalePrice", errors),
    defaultFemalePrice: normalizeOptionalNumber(input.defaultFemalePrice, "defaultFemalePrice", errors),
    displayOrder: normalizeOptionalInteger(input.displayOrder, "displayOrder", errors),
    isActive: normalizeOptionalBoolean(input.isActive)
  };

  if (mode === "update") {
    payload.id = normalizeString(input.id);

    if (!payload.id) {
      errors.push("id is required.");
    }
  }

  return {
    errors,
    payload
  };
}

function mapEntityToLitter(entity) {
  return {
    id: entity.rowKey,
    title: entity.title ?? "",
    birthDate: entity.birthDate ?? "",
    readyDate: entity.readyDate ?? "",
    status: entity.status ?? "active",
    bannerText: entity.bannerText ?? "",
    summaryText: entity.summaryText ?? "",
    defaultMalePrice: entity.defaultMalePrice ?? null,
    defaultFemalePrice: entity.defaultFemalePrice ?? null,
    displayOrder: entity.displayOrder ?? null,
    isActive: Boolean(entity.isActive),
    createdAt: entity.createdAt ?? "",
    updatedAt: entity.updatedAt ?? "",
    updatedBy: entity.updatedBy ?? ""
  };
}

function buildLitterEntity(payload, principal, existingEntity = null) {
  const now = new Date().toISOString();
  const rowKey = existingEntity?.rowKey ?? payload.id ?? crypto.randomUUID();
  const createdAt = existingEntity?.createdAt ?? now;
  const normalizedStatus = payload.status;
  const isActive = normalizedStatus === "active" ? payload.isActive : false;

  return {
    partitionKey: LITTER_PARTITION_KEY,
    rowKey,
    title: payload.title,
    birthDate: payload.birthDate,
    readyDate: payload.readyDate,
    status: normalizedStatus,
    bannerText: payload.bannerText,
    summaryText: payload.summaryText,
    defaultMalePrice: payload.defaultMalePrice,
    defaultFemalePrice: payload.defaultFemalePrice,
    displayOrder: payload.displayOrder,
    isActive,
    createdAt,
    updatedAt: now,
    updatedBy: principal?.userDetails ?? ""
  };
}

async function listLitters() {
  const client = getTableClients().litters;
  const items = [];

  for await (const entity of client.listEntities({
    queryOptions: {
      filter: `PartitionKey eq '${LITTER_PARTITION_KEY}'`
    }
  })) {
    items.push(mapEntityToLitter(entity));
  }

  items.sort((left, right) => {
    const leftOrder = left.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.displayOrder ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.title.localeCompare(right.title);
  });

  return items;
}

async function getLitterById(id) {
  const client = getTableClients().litters;

  try {
    const entity = await client.getEntity(LITTER_PARTITION_KEY, id);
    return mapEntityToLitter(entity);
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }

    throw error;
  }
}

async function getCurrentActiveLitter() {
  const litters = await listLitters();
  const activeStatusLitters = litters.filter((litter) => litter.status === "active");

  const explicitActive = activeStatusLitters.find((litter) => litter.isActive);

  if (explicitActive) {
    return explicitActive;
  }

  return activeStatusLitters[0] ?? null;
}

async function clearActiveFlagFromOtherLitters(currentLitterId) {
  const client = getTableClients().litters;

  for await (const entity of client.listEntities({
    queryOptions: {
      filter: `PartitionKey eq '${LITTER_PARTITION_KEY}' and isActive eq true`
    }
  })) {
    if (entity.rowKey === currentLitterId) {
      continue;
    }

    entity.isActive = false;
    entity.updatedAt = new Date().toISOString();
    await client.updateEntity(entity, "Replace");
  }
}

async function createLitter(payload, principal) {
  const client = getTableClients().litters;
  const entity = buildLitterEntity(payload, principal);

  if (entity.isActive) {
    await clearActiveFlagFromOtherLitters(entity.rowKey);
  }

  await client.createEntity(entity);
  return mapEntityToLitter(entity);
}

async function updateLitter(payload, principal) {
  const client = getTableClients().litters;

  let existingEntity;

  try {
    existingEntity = await client.getEntity(LITTER_PARTITION_KEY, payload.id);
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }

    throw error;
  }

  const entity = buildLitterEntity(payload, principal, existingEntity);

  if (entity.isActive) {
    await clearActiveFlagFromOtherLitters(entity.rowKey);
  }

  await client.updateEntity(entity, "Replace");
  return mapEntityToLitter(entity);
}

module.exports = {
  createLitter,
  getCurrentActiveLitter,
  getLitterById,
  listLitters,
  parseLitterInput,
  updateLitter
};
