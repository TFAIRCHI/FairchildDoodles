function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function getBlobConfig() {
  return {
    connectionString: getRequiredEnv("AZURE_STORAGE_CONNECTION_STRING"),
    containers: {
      siteImages: getRequiredEnv("BLOB_CONTAINER_SITE_IMAGES"),
      puppyImages: getRequiredEnv("BLOB_CONTAINER_PUPPY_IMAGES"),
      galleryImages: getRequiredEnv("BLOB_CONTAINER_GALLERY_IMAGES")
    }
  };
}

function getTableConfig() {
  return {
    connectionString: getRequiredEnv("AZURE_STORAGE_CONNECTION_STRING"),
    tables: {
      litters: getRequiredEnv("TABLE_LITTERS"),
      puppies: getRequiredEnv("TABLE_PUPPIES"),
      textBlocks: getRequiredEnv("TABLE_TEXTBLOCKS"),
      images: getRequiredEnv("TABLE_IMAGES")
    }
  };
}

module.exports = {
  getBlobConfig,
  getTableConfig,
  getRequiredEnv
};
