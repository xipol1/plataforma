const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const ensureDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const filePathFor = (collectionName) => path.join(DATA_DIR, `${collectionName}.json`);

const readCollection = (collectionName, fallback = []) => {
  ensureDir();
  const filePath = filePathFor(collectionName);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
    return Array.isArray(fallback) ? [...fallback] : fallback;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8') || '';
    if (!raw.trim()) return Array.isArray(fallback) ? [...fallback] : fallback;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return Array.isArray(fallback) ? [...fallback] : fallback;
  }
};

const writeCollection = (collectionName, data) => {
  ensureDir();
  const filePath = filePathFor(collectionName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return data;
};

module.exports = {
  readCollection,
  writeCollection
};
