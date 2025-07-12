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
} from 'react-native';
import {
  addArticle,
  getArticlesByBusiness,
  deleteArticle,
} from '../database/sqlite';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function ArticleScreen({ route }) {
  const { businessId, businessName } = route.params;
  const [articles, setArticles] = useState([]);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    const data = await getArticlesByBusiness(businessId);
    setArticles(data);
  };

  const handleAdd = async () => {
    if (!name.trim() || !qty || !sellingPrice) return;
    await addArticle(
      uuidv4(),
      name.trim(),
      parseInt(qty, 10),
      parseFloat(sellingPrice),
      businessId,
    );
    setName('');
    setQty('');
    setSellingPrice('');
    setModalVisible(false);
    loadArticles();
  };

  const handleDelete = async id => {
    await deleteArticle(id);
    loadArticles();
  };

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
        <Text style={styles.title}>Articles for {businessName}</Text>
        <FlatList
          data={articles}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <Text>
                {item.name} | Qty: {item.qty} | Price: {item.selling_price}
              </Text>
              <Button title="Delete" onPress={() => handleDelete(item.id)} />
            </View>
          )}
        />
      </ScrollView>
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ fontSize: 32, color: '#fff' }}>+</Text>
      </TouchableOpacity>
      {/* Modal for Add Article */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.label}>Article Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter article name"
              placeholderTextColor="#8888cc"
              value={name}
              onChangeText={setName}
            />
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter quantity"
              placeholderTextColor="#8888cc"
              value={qty}
              onChangeText={setQty}
              keyboardType="numeric"
            />
            <Text style={styles.label}>Selling Price</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter selling price"
              placeholderTextColor="#8888cc"
              value={sellingPrice}
              onChangeText={setSellingPrice}
              keyboardType="numeric"
            />
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <Button
                title="Cancel"
                onPress={() => {
                  setModalVisible(false);
                  setName('');
                  setQty('');
                  setSellingPrice('');
                }}
              />
              <Button title="Add Article" onPress={handleAdd} />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
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
