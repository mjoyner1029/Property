// Persistence layer for demo data
import seed from './seed';

// LocalStorage key for demo data
const STORAGE_KEY = 'demo_db';

// Initialize DB with seed data or load from localStorage
export const initializeDB = () => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    } else {
      // First time - use seed data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
  } catch (error) {
    console.error('Error initializing demo database:', error);
    // Fallback to seed data
    return seed;
  }
};

// Save the current state of the DB to localStorage
export const persistDB = (db) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (error) {
    console.error('Error persisting demo database:', error);
  }
};

// Reset DB to initial seed data
export const resetDB = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
};

// Current database in memory
let db = null;

// Get the database (lazy load)
export const getDB = () => {
  if (!db) {
    db = initializeDB();
  }
  return db;
};

// Update a collection in the database
export const updateCollection = (collectionName, updatedData) => {
  const currentDB = getDB();
  db = {
    ...currentDB,
    [collectionName]: updatedData,
  };
  persistDB(db);
  return db;
};

// Add an item to a collection
export const addItem = (collectionName, item) => {
  const currentDB = getDB();
  const collection = [...currentDB[collectionName], item];
  return updateCollection(collectionName, collection);
};

// Update an item in a collection
export const updateItem = (collectionName, id, updates) => {
  const currentDB = getDB();
  const collection = currentDB[collectionName].map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
  return updateCollection(collectionName, collection);
};

// Delete an item from a collection
export const deleteItem = (collectionName, id) => {
  const currentDB = getDB();
  const collection = currentDB[collectionName].filter((item) => item.id !== id);
  return updateCollection(collectionName, collection);
};

// Get an item by ID
export const getItemById = (collectionName, id) => {
  const currentDB = getDB();
  return currentDB[collectionName].find((item) => item.id === id) || null;
};

// Get all items from a collection
export const getCollection = (collectionName) => {
  const currentDB = getDB();
  return currentDB[collectionName] || [];
};

// Query a collection with filters
export const queryCollection = (collectionName, filters) => {
  const collection = getCollection(collectionName);
  
  if (!filters || Object.keys(filters).length === 0) {
    return collection;
  }
  
  return collection.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      // Handle array values (OR condition)
      if (Array.isArray(value)) {
        return value.includes(item[key]);
      }
      // Handle object with special operators
      if (value !== null && typeof value === 'object') {
        const operators = Object.keys(value);
        return operators.every(op => {
          const compareValue = value[op];
          switch(op) {
            case '$eq': return item[key] === compareValue;
            case '$ne': return item[key] !== compareValue;
            case '$gt': return item[key] > compareValue;
            case '$gte': return item[key] >= compareValue;
            case '$lt': return item[key] < compareValue;
            case '$lte': return item[key] <= compareValue;
            case '$in': return Array.isArray(compareValue) && compareValue.includes(item[key]);
            case '$nin': return Array.isArray(compareValue) && !compareValue.includes(item[key]);
            default: return false;
          }
        });
      }
      // Simple equality
      return item[key] === value;
    });
  });
};

export default {
  getDB,
  initializeDB,
  resetDB,
  persistDB,
  updateCollection,
  addItem,
  updateItem,
  deleteItem,
  getItemById,
  getCollection,
  queryCollection,
};
