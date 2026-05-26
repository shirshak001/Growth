import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

// Helper to read database collection
export const readCollection = (collection) => {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error(`Error reading collection ${collection}:`, error);
    return [];
  }
};

// Helper to write database collection
export const writeCollection = (collection, data) => {
  const filePath = getFilePath(collection);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing collection ${collection}:`, error);
    return false;
  }
};

// Generic DB methods
export const db = {
  find: (collection, queryFn) => {
    const data = readCollection(collection);
    return data.filter(queryFn);
  },

  findOne: (collection, queryFn) => {
    const data = readCollection(collection);
    return data.find(queryFn) || null;
  },

  insert: (collection, record) => {
    const data = readCollection(collection);
    const newRecord = { ...record, id: record.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    data.push(newRecord);
    writeCollection(collection, data);
    return newRecord;
  },

  update: (collection, queryFn, updateData) => {
    const data = readCollection(collection);
    let updatedCount = 0;
    const updatedData = data.map(item => {
      if (queryFn(item)) {
        updatedCount++;
        return { ...item, ...updateData };
      }
      return item;
    });
    if (updatedCount > 0) {
      writeCollection(collection, updatedData);
    }
    return updatedCount;
  },

  delete: (collection, queryFn) => {
    const data = readCollection(collection);
    const filtered = data.filter(item => !queryFn(item));
    const deletedCount = data.length - filtered.length;
    if (deletedCount > 0) {
      writeCollection(collection, filtered);
    }
    return deletedCount;
  }
};
