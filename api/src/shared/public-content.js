const { listTextBlocks } = require("./text-blocks");

function blocksToMap(blocks) {
  const map = new Map();

  blocks
    .filter((block) => block.isActive)
    .forEach((block) => {
      map.set(`${block.sectionKey}.${block.fieldKey}`, block.contentValue);
    });

  return map;
}

async function getPageContentMap(pageKey) {
  const blocks = await listTextBlocks({ pageKey });
  return blocksToMap(blocks);
}

function getMappedValue(map, key, fallback) {
  return map.has(key) ? map.get(key) : fallback;
}

module.exports = {
  getMappedValue,
  getPageContentMap
};
