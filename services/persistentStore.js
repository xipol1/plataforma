'use strict';

/**
 * Simple JSON file-based persistent store.
 * Files are kept in ./data/<collection>.json
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

/**
 * Read a collection. Returns defaultValue if the file does not exist or is invalid.
 */
function readCollection(collection, defaultValue = []) {
  ensureDir();
  const fp = filePath(collection);
  try {
    if (!fs.existsSync(fp)) return defaultValue;
    const raw = fs.readFileSync(fp, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return defaultValue;
  }
}

/**
 * Write (overwrite) a collection file with the given value.
 */
function writeCollection(collection, value) {
  ensureDir();
  const fp = filePath(collection);
  fs.writeFileSync(fp, JSON.stringify(value, null, 2), 'utf8');
}

module.exports = { readCollection, writeCollection };
