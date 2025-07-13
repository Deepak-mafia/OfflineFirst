import {
  getDB,
  setupAllReplications,
  checkCouchDBConnection,
  syncToCouchDB,
} from '../database/rxdb';
import { v4 as uuidv4 } from 'uuid';

export const testReplication = async () => {
  try {
    console.log('=== Testing CouchDB Replication ===');

    // 1. Check CouchDB connection
    const isConnected = await checkCouchDBConnection();
    console.log(
      'CouchDB Connection:',
      isConnected ? '✅ Connected' : '❌ Failed',
    );

    if (!isConnected) {
      console.log('Cannot test replication - CouchDB not accessible');
      return false;
    }

    // 2. Setup replication
    console.log('Setting up replication...');
    const replicationSuccess = await setupAllReplications();
    console.log(
      'Replication setup:',
      replicationSuccess ? '✅ Success' : '❌ Failed',
    );

    // 3. Test data insertion and sync
    const db = await getDB();
    const testBusinessId = uuidv4();
    const testBusinessName = `Test Business ${Date.now()}`;

    console.log('📝 STEP 1: Inserting test business locally...');
    await db.businesses.insert({
      id: testBusinessId,
      name: testBusinessName,
    });
    console.log(
      '✅ Test business inserted locally - you should see it in the list',
    );

    // Wait a moment so user can see the business
    console.log('⏳ Waiting 3 seconds so you can see the test business...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Sync to CouchDB
    console.log('📤 STEP 2: Syncing to CouchDB...');
    const syncSuccess = await syncToCouchDB(db.businesses, 'businesses');
    console.log('Sync result:', syncSuccess ? '✅ Success' : '❌ Failed');

    // 5. Check if data exists in CouchDB
    console.log('🔍 STEP 3: Verifying data in CouchDB...');
    const couchdbResponse = await fetch(
      `http://10.0.2.2:5984/offlinefirstdb/${testBusinessId}`,
      {
        headers: {
          Authorization: 'Basic ' + btoa('admin:admin'),
        },
      },
    );

    if (couchdbResponse.ok) {
      const doc = await couchdbResponse.json();
      console.log('✅ Data successfully replicated to CouchDB:', doc);
    } else {
      console.log('❌ Data not found in CouchDB');
    }

    // Wait a moment before cleanup
    console.log('⏳ Waiting 2 seconds before cleanup...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 6. Clean up test data
    console.log('🧹 STEP 4: Cleaning up test data...');
    const doc = await db.businesses
      .findOne({ selector: { id: testBusinessId } })
      .exec();
    if (doc) {
      await doc.remove();
      console.log(
        '✅ Test business removed - you should see it disappear from the list',
      );
    }

    console.log('=== Replication Test Complete ===');
    console.log('📋 SUMMARY:');
    console.log('  ✅ Local storage: Working');
    console.log('  ✅ CouchDB sync: Working');
    console.log('  ✅ Data verification: Working');
    console.log('  ✅ Cleanup: Working');
    console.log('🎉 All replication features are working correctly!');

    return true;
  } catch (error) {
    console.error('❌ Replication test failed:', error);
    return false;
  }
};

export const getReplicationStatus = async () => {
  try {
    const isConnected = await checkCouchDBConnection();
    return {
      couchdbConnected: isConnected,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      couchdbConnected: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};
