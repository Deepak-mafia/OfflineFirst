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
import { getDB } from '../database/rxdb';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function BusinessScreen({ navigation }) {
  const [businesses, setBusinesses] = useState([]);
  const [name, setName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [db, setDb] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const dbInstance = await getDB();
        console.log('DB instance:', dbInstance);
        console.log('Collections:', Object.keys(dbInstance.collections));
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

  const handleAdd = async () => {
    if (!name.trim() || !db) {
      return;
    }
    await db.businesses.insert({ id: uuidv4(), name: name.trim() });
    setName('');
    setModalVisible(false);
  };

  const handleDelete = async id => {
    if (!db) return;
    const doc = await db.businesses.findOne({ selector: { id } }).exec();
    if (doc) await doc.remove();
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
        <Text style={styles.title}>Businesses</Text>
        <FlatList
          data={businesses}
          keyExtractor={item => item?.id || Math.random().toString()}
          renderItem={({ item }) =>
            item ? (
              <View style={styles.itemRow}>
                <Text>{item.name}</Text>
                <Button title="Delete" onPress={() => handleDelete(item.id)} />
                <Button
                  title="Articles"
                  onPress={() =>
                    navigation.navigate('Articles', {
                      businessId: item.id,
                      businessName: item.name,
                    })
                  }
                />
              </View>
            ) : null
          }
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
