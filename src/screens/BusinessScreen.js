// we need to update some flow

// if user add any businessor anu articall it should sync immediately if no internet them should sync  whrn internet came back

// also no extra test businesses, it is creating confussion only

// also need to give a manual sync btn on data will be sync

// just wanted to know how is the flow if someone add a business how will it sync to other users devic

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  getDB,
  setupAllReplications,
  checkCouchDBConnection,
  deleteDocumentFromCouchDB,
  syncToCouchDB,
  syncFromCouchDB,
} from '../database/rxdb';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import Toast from 'react-native-toast-message';
import NetInfo from '@react-native-community/netinfo';
import { Trash2, RefreshCw, FileText } from 'lucide-react-native';

export default function BusinessScreen({ navigation }) {
  const [businesses, setBusinesses] = useState([]);
  const [name, setName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [db, setDb] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const dbInstance = await getDB();
        console.log('DB instance:', dbInstance);
        console.log('Collections:', Object.keys(dbInstance.collections));

        // Check CouchDB connection and setup replication
        const isCouchDBAvailable = await checkCouchDBConnection();
        if (isCouchDBAvailable) {
          console.log('Setting up CouchDB replication...');
          await setupAllReplications();
          console.log('CouchDB replication setup complete');
        } else {
          console.log('CouchDB not available, running in offline mode only');
        }
      } catch (err) {
        console.log('RxDB error:', err);
      }
    })();
  }, []);

  useEffect(() => {
    let sub;
    let isMounted = true;
    (async () => {
      try {
        const dbInstance = await getDB();
        if (!isMounted) return;
        setDb(dbInstance);
        sub = dbInstance.businesses
          .find()
          .sort({ name: 'asc' })
          .$.subscribe(businessDocs => {
            setBusinesses(
              (businessDocs || [])
                .filter(doc => !!doc)
                .map(doc => doc.toJSON()),
            );
            setLoading(false);
          });
        setSubscription(sub);
      } catch (err) {
        console.log('RxDB error:', err);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
      if (sub) sub.unsubscribe();
    };
  }, []);

  // Auto-sync on reconnect
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        handleSync();
        Toast.show({ type: 'info', text1: 'Online: Auto-sync triggered!' });
      }
    });
    return () => unsubscribe();
  }, [db]);

  const handleSync = async () => {
    if (!db) return;
    try {
      await syncFromCouchDB(db.businesses, 'businesses');
      await syncFromCouchDB(db.articles, 'articles');
      await syncToCouchDB(db.businesses, 'businesses');
      await syncToCouchDB(db.articles, 'articles');
      Toast.show({ type: 'success', text1: 'Sync complete!' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Sync failed!' });
    }
  };

  const handleAdd = async () => {
    if (!name.trim() || !db) {
      Toast.show({ type: 'error', text1: 'Business name required!' });
      return;
    }
    await db.businesses.insert({ id: uuidv4(), name: name.trim() });
    setName('');
    setModalVisible(false);
    await syncToCouchDB(db.businesses, 'businesses');
    await syncToCouchDB(db.articles, 'articles');
    Toast.show({ type: 'success', text1: 'Business added!' });
  };

  const handleDelete = async id => {
    if (!db) return;
    // Delete all articles under this business
    const articles = await db.articles
      .find({ selector: { business_id: id } })
      .exec();
    for (const article of articles) {
      await article.remove();
      await deleteDocumentFromCouchDB('articles', article.get('id'));
    }
    // Now delete the business
    const doc = await db.businesses.findOne({ selector: { id } }).exec();
    if (doc) {
      await doc.remove();
      await deleteDocumentFromCouchDB('businesses', id);
    }
    await syncToCouchDB(db.businesses, 'businesses');
    await syncToCouchDB(db.articles, 'articles');
    Toast.show({ type: 'success', text1: 'Business deleted!' });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await handleSync();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#333399" />
        <Text style={{ marginTop: 12, color: '#333399' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <Text style={styles.title}>Businesses</Text>
          <RefreshCw
            size={28}
            color="#333399"
            onPress={handleSync}
            style={{ marginLeft: 8 }}
            accessibilityLabel="Sync"
          />
        </View>
        <FlatList
          data={businesses}
          keyExtractor={item => item?.id || Math.random().toString()}
          renderItem={({ item }) =>
            item ? (
              <View style={styles.itemRow}>
                <Text>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Trash2
                    size={24}
                    color="#F44336"
                    onPress={() => handleDelete(item.id)}
                    style={{ marginRight: 12 }}
                    accessibilityLabel="Delete"
                  />
                  <FileText
                    size={24}
                    color="#333399"
                    onPress={() =>
                      navigation.navigate('Articles', {
                        businessId: item.id,
                        businessName: item.name,
                      })
                    }
                    accessibilityLabel="Articles"
                  />
                </View>
              </View>
            ) : null
          }
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </ScrollView>
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ fontSize: 32, color: '#fff' }}>+</Text>
      </TouchableOpacity>
      {/* Modal for Add Business */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.label}>Business Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter business name"
              placeholderTextColor="#8888cc"
              value={name}
              onChangeText={setName}
            />
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <Button
                title="Cancel"
                onPress={() => {
                  setModalVisible(false);
                  setName('');
                }}
              />
              <Button title="Add Business" onPress={handleAdd} disabled={!db} />
            </View>
          </View>
        </View>
      </Modal>
      {/* Toast Message */}
      <Toast />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scrollContainer: { flexGrow: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 12,
    borderRadius: 4,
    color: '#222',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 4, color: '#333399' },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#333399',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
});
