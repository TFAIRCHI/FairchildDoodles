const crypto = require("node:crypto");
const { getTableClients } = require("./tables");

const PUPPY_PARTITION_KEY = "puppy";

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

function normalizeAvailabilityStatus(value) {
  const normalized = normalizeString(value).toLowerCase();
  const allowed = new Set(["available", "reserved", "sold"]);

  if (!normalized) {
    return "available";
  }

  return allowed.has(normalized) ? normalized : "available";
}

function normalizeGender(value) {
  const normalized = normalizeString(value).toLowerCase();
  const allowed = new Set(["male", "female"]);

  if (!normalized) {
    return "";
  }

  return allowed.has(normalized) ? normalized : "";
}

function parsePuppyInput(input, mode = "create") {
  const errors = [];
  const displayName = normalizeString(input.displayName);
  const litterId = normalizeString(input.litterId);

  if (!displayName) {
    errors.push("displayName is required.");
  }

  if (!litterId) {
    errors.push("litterId is required.");
  }

  const payload = {
    displayName,
    litterId,
    gender: normalizeGender(input.gender),
    colorLabel: normalizeOptionalString(input.colorLabel),
    price: normalizeOptionalNumber(input.price, "price", errors),
    availabilityStatus: normalizeAvailabilityStatus(input.availabilityStatus),
    shortSummary: normalizeOptionalString(input.shortSummary),
    longDescription: normalizeOptionalString(input.longDescription),
    featuredImageId: normalizeOptionalString(input.featuredImageId),
    displayOrder: normalizeOptionalInteger(input.displayOrder, "displayOrder", errors),
    isActive: normalizeOptionalBoolean(input.isActive)
  };

  if (input.gender && !payload.gender) {
    errors.push("gender must be male, female, or empty.");
  }

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

function mapEntityToPuppy(entity) {
  return {
    id: entity.rowKey,
    litterId: entity.litterId ?? "",
    displayName: entity.displayName ?? "",
    gender: entity.gender ?? "",
    colorLabel: entity.colorLabel ?? "",
    price: entity.price ?? null,
    availabilityStatus: entity.availabilityStatus ?? "available",
    shortSummary: entity.shortSummary ?? "",
    longDescription: entity.longDescription ?? "",
    featuredImageId: entity.featuredImageId ?? "",
    displayOrder: entity.displayOrder ?? null,
    isActive: Boolean(entity.isActive),
    createdAt: entity.createdAt ?? "",
    updatedAt: entity.updatedAt ?? "",
    updatedBy: entity.updatedBy ?? ""
  };
}

function buildPuppyEntity(payload, principal, existingEntity = null) {
  const now = new Date().toISOString();
  const rowKey = existingEntity?.rowKey ?? payload.id ?? crypto.randomUUID();
  const createdAt = existingEntity?.createdAt ?? now;

  return {
    partitionKey: PUPPY_PARTITION_KEY,
    rowKey,
    litterId: payload.litterId,
    displayName: payload.displayName,
    gender: payload.gender,
    colorLabel: payload.colorLabel,
    price: payload.price,
    availabilityStatus: payload.availabilityStatus,
    shortSummary: payload.shortSummary,
    longDescription: payload.longDescription,
    featuredImageId: payload.featuredImageId,
    displayOrder: payload.displayOrder,
    isActive: payload.isActive,
    createdAt,
    updatedAt: now,
    updatedBy: principal?.userDetails ?? ""
  };
}

async function listPuppies(options = {}) {
  const client = getTableClients().puppies;
  const items = [];
  const filters = [`PartitionKey eq '${PUPPY_PARTITION_KEY}'`];

  if (options.litterId) {
    filters.push(`litterId eq '${options.litterId.replace(/'/g, "''")}'`);
  }

  for await (const entity of client.listEntities({
    queryOptions: {
      filter: filters.join(" and ")
    }
  })) {
    items.push(mapEntityToPuppy(entity));
  }

  items.sort((left, right) => {
    const leftOrder = left.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.displayOrder ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.displayName.localeCompare(right.displayName);
  });

  return items;
}

async function getPuppyById(id) {
  const client = getTableClients().puppies;

  try {
    const entity = await client.getEntity(PUPPY_PARTITION_KEY, id);
    return mapEntityToPuppy(entity);
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }

    throw error;
  }
}

async function createPuppy(payload, principal) {
  const client = getTableClients().puppies;
  const entity = buildPuppyEntity(payload, principal);
  await client.createEntity(entity);
  return mapEntityToPuppy(entity);
}

async function updatePuppy(payload, principal) {
  const client = getTableClients().puppies;

  let existingEntity;

  try {
    existingEntity = await client.getEntity(PUPPY_PARTITION_KEY, payload.id);
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }

    throw error;
  }

  const entity = buildPuppyEntity(payload, principal, existingEntity);
  await client.updateEntity(entity, "Replace");
  return mapEntityToPuppy(entity);
}

module.exports = {
  createPuppy,
  getPuppyById,
  listPuppies,
  parsePuppyInput,
  updatePuppy
};
