const crypto = require("node:crypto");
const { getTableClients } = require("./tables");

const TEXT_BLOCK_PARTITION_KEY = "textblock";
const ALLOWED_PAGE_KEYS = new Set(["about", "contact"]);

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

function parseTextBlockInput(input, mode = "create") {
  const errors = [];
  const pageKey = normalizeString(input.pageKey).toLowerCase();
  const sectionKey = normalizeString(input.sectionKey);
  const fieldKey = normalizeString(input.fieldKey);
  const contentValue = normalizeOptionalString(input.contentValue);

  if (!ALLOWED_PAGE_KEYS.has(pageKey)) {
    errors.push("pageKey must be about or contact.");
  }

  if (!sectionKey) {
    errors.push("sectionKey is required.");
  }

  if (!fieldKey) {
    errors.push("fieldKey is required.");
  }

  const payload = {
    pageKey,
    sectionKey,
    fieldKey,
    fieldLabel: normalizeOptionalString(input.fieldLabel),
    contentValue,
    inputType: normalizeOptionalString(input.inputType) || "textarea",
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

function mapEntityToTextBlock(entity) {
  return {
    id: entity.rowKey,
    pageKey: entity.pageKey ?? "",
    sectionKey: entity.sectionKey ?? "",
    fieldKey: entity.fieldKey ?? "",
    fieldLabel: entity.fieldLabel ?? "",
    contentValue: entity.contentValue ?? "",
    inputType: entity.inputType ?? "textarea",
    displayOrder: entity.displayOrder ?? null,
    isActive: Boolean(entity.isActive),
    createdAt: entity.createdAt ?? "",
    updatedAt: entity.updatedAt ?? "",
    updatedBy: entity.updatedBy ?? ""
  };
}

function buildTextBlockEntity(payload, principal, existingEntity = null) {
  const now = new Date().toISOString();
  const rowKey = existingEntity?.rowKey ?? payload.id ?? crypto.randomUUID();
  const createdAt = existingEntity?.createdAt ?? now;

  return {
    partitionKey: TEXT_BLOCK_PARTITION_KEY,
    rowKey,
    pageKey: payload.pageKey,
    sectionKey: payload.sectionKey,
    fieldKey: payload.fieldKey,
    fieldLabel: payload.fieldLabel,
    contentValue: payload.contentValue,
    inputType: payload.inputType,
    displayOrder: payload.displayOrder,
    isActive: payload.isActive,
    createdAt,
    updatedAt: now,
    updatedBy: principal?.userDetails ?? ""
  };
}

async function listTextBlocks(options = {}) {
  const client = getTableClients().textBlocks;
  const filters = [`PartitionKey eq '${TEXT_BLOCK_PARTITION_KEY}'`];

  if (options.pageKey) {
    filters.push(`pageKey eq '${options.pageKey.replace(/'/g, "''")}'`);
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
    items.push(mapEntityToTextBlock(entity));
  }

  items.sort((left, right) => {
    const leftOrder = left.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.displayOrder ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    if (left.sectionKey !== right.sectionKey) {
      return left.sectionKey.localeCompare(right.sectionKey);
    }

    return left.fieldKey.localeCompare(right.fieldKey);
  });

  return items;
}

async function getTextBlockById(id) {
  try {
    const entity = await getTableClients().textBlocks.getEntity(TEXT_BLOCK_PARTITION_KEY, id);
    return mapEntityToTextBlock(entity);
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }

    throw error;
  }
}

async function createTextBlock(payload, principal) {
  const entity = buildTextBlockEntity(payload, principal);
  await getTableClients().textBlocks.createEntity(entity);
  return mapEntityToTextBlock(entity);
}

async function updateTextBlock(payload, principal) {
  const client = getTableClients().textBlocks;
  let existingEntity;

  try {
    existingEntity = await client.getEntity(TEXT_BLOCK_PARTITION_KEY, payload.id);
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }

    throw error;
  }

  const entity = buildTextBlockEntity(payload, principal, existingEntity);
  await client.updateEntity(entity, "Replace");
  return mapEntityToTextBlock(entity);
}

module.exports = {
  createTextBlock,
  getTextBlockById,
  listTextBlocks,
  parseTextBlockInput,
  updateTextBlock
};
