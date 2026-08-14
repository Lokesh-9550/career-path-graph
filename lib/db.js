// lib/db.js
import neo4j from 'neo4j-driver';

let driver;

export function getDriver() {
  if (!driver) {
    const uri = process.env.COGNODB_URI;
    const user = process.env.COGNODB_USER;
    const password = process.env.COGNODB_PASSWORD;
    
    if (!uri || !user || !password) {
      throw new Error('Missing CognoDB environment variables. Check your .env.local file.');
    }
    
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
}