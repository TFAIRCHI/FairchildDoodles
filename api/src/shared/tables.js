const { TableClient } = require("@azure/data-tables");
const { getTableConfig } = require("./config");

function getTableClients() {
  const { connectionString, tables } = getTableConfig();

  return {
    litters: TableClient.fromConnectionString(connectionString, tables.litters),
    puppies: TableClient.fromConnectionString(connectionString, tables.puppies),
    textBlocks: TableClient.fromConnectionString(connectionString, tables.textBlocks),
    images: TableClient.fromConnectionString(connectionString, tables.images)
  };
}

async function validateConfiguredTables() {
  const clients = getTableClients();
  const entries = Object.entries(clients);
  const results = {};

  for (const [key, client] of entries) {
    try {
      await client.getEntity("__healthcheck__", "__healthcheck__");
    } catch (error) {
      if (error.statusCode !== 404) {
        throw error;
      }
    }

    results[key] = {
      tableName: client.tableName,
      reachable: true
    };
  }

  return results;
}

module.exports = {
  getTableClients,
  validateConfiguredTables
};
