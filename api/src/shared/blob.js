const {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters
} = require("@azure/storage-blob");
const { getBlobConfig } = require("./config");

function getBlobServiceClient() {
  const { connectionString } = getBlobConfig();
  return BlobServiceClient.fromConnectionString(connectionString);
}

function parseConnectionString(connectionString) {
  return connectionString
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce((map, segment) => {
      const separatorIndex = segment.indexOf("=");

      if (separatorIndex === -1) {
        return map;
      }

      const key = segment.slice(0, separatorIndex);
      const value = segment.slice(separatorIndex + 1);
      map[key] = value;
      return map;
    }, {});
}

function getBlobContainers() {
  const { containers } = getBlobConfig();
  return containers;
}

function getContainerClient(containerName) {
  return getBlobServiceClient().getContainerClient(containerName);
}

function getBlobUrl(containerName, blobName) {
  return `${getContainerClient(containerName).url}/${blobName}`;
}

function getBlobReadUrl(containerName, blobName, expiresInHours = 6) {
  const { connectionString } = getBlobConfig();
  const parts = parseConnectionString(connectionString);
  const accountName = parts.AccountName;
  const accountKey = parts.AccountKey;

  if (!accountName || !accountKey) {
    return getBlobUrl(containerName, blobName);
  }

  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  const startsOn = new Date(Date.now() - 5 * 60 * 1000);
  const expiresOn = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn,
      expiresOn
    },
    credential
  ).toString();

  return `${getBlobUrl(containerName, blobName)}?${sasToken}`;
}

async function validateConfiguredContainers() {
  const containers = getBlobContainers();
  const entries = Object.entries(containers);
  const results = {};

  for (const [key, containerName] of entries) {
    const client = getContainerClient(containerName);
    const exists = await client.exists();

    results[key] = {
      containerName,
      exists
    };
  }

  return results;
}

module.exports = {
  getBlobUrl,
  getBlobReadUrl,
  getBlobContainers,
  getBlobServiceClient,
  getContainerClient,
  validateConfiguredContainers
};
