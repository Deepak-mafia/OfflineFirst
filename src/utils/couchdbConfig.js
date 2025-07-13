import { Platform } from 'react-native';

// Determine the correct CouchDB URL based on platform
export const getCouchDBUrl = () => {
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    return 'http://10.0.2.2:5984';
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost
    return 'http://localhost:5984';
  } else {
    // Web or other platforms
    return 'http://localhost:5984';
  }
};

export const COUCHDB_CONFIG = {
  url: getCouchDBUrl(),
  database: 'offlinefirstdb',
  username: 'admin',
  password: 'admin',
};

console.log(`CouchDB URL for ${Platform.OS}: ${COUCHDB_CONFIG.url}`);
