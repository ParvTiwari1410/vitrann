import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type DeliveredItem = {
  name: string;
  qty: number;
};

type CustomerType = {
  id: string;
  name: string;
  type: string;
  address: string;
  deliveredItems: DeliveredItem[];
  paymentReceived: number;
};

export default function CustomerDeliveryScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  let productsObj: Record<string, string> = {};
  try {
    productsObj = params.products ? JSON.parse(params.products as string) : {};
  } catch {
    productsObj = {};
  }

  const dynamicProductOptions = Object.entries(productsObj)
    .filter(([_, qty]) => Number(qty) > 0)
    .map(([product]) => product);

  const DEMO_CUSTOMERS: CustomerType[] = [
    {
      id: '1',
      name: 'Anand Sweets',
      type: 'B2B',
      address: '123, MG Road, Indore',
      deliveredItems: [],
      paymentReceived: 0,
    },
    {
      id: '2',
      name: 'Mrs. Sharma',
      type: 'B2C',
      address: '45, Scheme 78, Indore',
      deliveredItems: [],
      paymentReceived: 0,
    },
  ];

  const [customers, setCustomers] = useState<CustomerType[]>(DEMO_CUSTOMERS);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const [newProduct, setNewProduct] = useState('');
  const [newQty, setNewQty] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  const customer = customers[selectedIdx];

  const getTotalDelivered = (productName: string): number => {
    return customers.reduce(
      (total, cust) =>
        total +
        cust.deliveredItems
          .filter((item) => item.name === productName)
          .reduce((subTotal, item) => subTotal + item.qty, 0),
      0
    );
  };

  const handleAddItem = () => {
    if (!newProduct || !newQty) {
      Alert.alert('Error', 'Please select a product and enter quantity.');
      return;
    }
    const enteredQty = Number(newQty);
    if (enteredQty <= 0 || isNaN(enteredQty)) {
      Alert.alert('Error', 'Please enter a valid quantity.');
      return;
    }
    if (!dynamicProductOptions.includes(newProduct)) {
      Alert.alert('Error', 'Invalid product selected.');
      return;
    }
    const totalDelivered = getTotalDelivered(newProduct);
    const allowedQty = Number(productsObj[newProduct]);
    if (totalDelivered + enteredQty > allowedQty) {
      Alert.alert(
        'Stock Exceeded',
        `You have only ${allowedQty - totalDelivered} packets of ${newProduct} left to deliver.`
      );
      return;
    }

    const updatedDeliveredItems: DeliveredItem[] = [
      ...customer.deliveredItems,
      { name: newProduct, qty: enteredQty },
    ];
    const updatedCustomers = [...customers];
    updatedCustomers[selectedIdx] = {
      ...updatedCustomers[selectedIdx],
      deliveredItems: updatedDeliveredItems,
    };
    setCustomers(updatedCustomers);
    setNewProduct('');
    setNewQty('');
  };

  const handleRemoveItem = (index: number) => {
    Alert.alert('Remove item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updatedDeliveredItems = customer.deliveredItems.filter(
            (_, i) => i !== index
          );
          const updatedCustomers = [...customers];
          updatedCustomers[selectedIdx] = {
            ...updatedCustomers[selectedIdx],
            deliveredItems: updatedDeliveredItems,
          };
          setCustomers(updatedCustomers);
        },
      },
    ]);
  };

  const handleCollectPayment = () => {
    if (!paymentAmount) {
      Alert.alert('Error', 'Please enter the amount received.');
      return;
    }
    const amountToAdd = Number(paymentAmount);
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount.');
      return;
    }
    const updatedCustomers = [...customers];
    updatedCustomers[selectedIdx] = {
      ...updatedCustomers[selectedIdx],
      paymentReceived: updatedCustomers[selectedIdx].paymentReceived + amountToAdd,
    };
    setCustomers(updatedCustomers);
    setPaymentAmount('');
  };

  const handleRemovePayment = () => {
    Alert.alert('Remove payment', 'Are you sure you want to reset payment to zero?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          const updatedCustomers = [...customers];
          updatedCustomers[selectedIdx] = {
            ...updatedCustomers[selectedIdx],
            paymentReceived: 0,
          };
          setCustomers(updatedCustomers);
        },
      },
    ]);
  };

  const handleConfirmNext = () => {
    if (selectedIdx < customers.length - 1) {
      setSelectedIdx(selectedIdx + 1);
      setPaymentAmount('');
      setNewProduct('');
      setNewQty('');
    } else {
      const productsStr = encodeURIComponent(JSON.stringify(productsObj));
      router.push(`/ReturnedStocksScreen?products=${productsStr}`);
    }
  };

  const filteredDeliveredItems = customer.deliveredItems.filter((item) =>
    dynamicProductOptions.includes(item.name)
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {customers.map((c, idx) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.tab, idx === selectedIdx && styles.activeTab]}
            onPress={() => setSelectedIdx(idx)}
          >
            <Text style={idx === selectedIdx ? styles.activeTabText : styles.tabText}>
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.card}>
        <Text style={styles.name}>
          {customer.name} ({customer.type})
        </Text>
        <Text style={styles.address}>{customer.address}</Text>

        <View style={styles.subsection}>
          <Text style={styles.sectionTitle}>Delivered Items</Text>
          {filteredDeliveredItems.length > 0 ? (
            filteredDeliveredItems.map((item, idx) => (
              <View key={idx} style={styles.deliveredItemRow}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.deliveredProductName}>{item.name}</Text>
                  <Text style={styles.deliveredProductQty}>• {item.qty} Pkt</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeItemButton}
                  onPress={() => handleRemoveItem(idx)}
                >
                  <Text style={styles.removeItemText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.deliveredProductName}>No delivered items yet.</Text>
          )}
        </View>

        <View style={styles.subsection}>
          <Text style={styles.sectionTitle}>Add Item</Text>
          <View style={styles.productList}>
            {dynamicProductOptions.length > 0 ? (
              dynamicProductOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.productCard,
                    newProduct === option ? styles.productCardSelected : null,
                  ]}
                  onPress={() => setNewProduct(option)}
                >
                  <Text style={styles.productName}>{option}</Text>
                  <Text style={styles.productAvailable}>
                    Available: {Number(productsObj[option]) - getTotalDelivered(option)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text>No available products to add.</Text>
            )}
          </View>
          <View style={[styles.row, { marginTop: 5 }]}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={newQty}
              placeholder="Qty"
              onChangeText={setNewQty}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                (!newProduct || !newQty) && styles.addButtonDisabled,
              ]}
              onPress={handleAddItem}
              disabled={!newProduct || !newQty}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.subsection}>
          <Text style={styles.sectionTitle}>Collect Payment</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              value={paymentAmount}
              placeholder="Amount Received"
              onChangeText={setPaymentAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.collectButton} onPress={handleCollectPayment}>
              <Text style={styles.collectButtonText}>Collect</Text>
            </TouchableOpacity>
          </View>
          {customer.paymentReceived > 0 && (
            <View style={styles.paymentStatusRow}>
              <Text style={styles.paymentStatusText}>
                Total Paid: ₹{customer.paymentReceived}
              </Text>
              <TouchableOpacity
                style={styles.removePaymentButton}
                onPress={handleRemovePayment}
              >
                <Text style={styles.removePaymentText}>Reset Payment</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmNext}>
        <Text style={styles.confirmButtonText}>Confirm & Next</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  tabs: {
    flexDirection: 'row',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 7,
    marginHorizontal: 3,
    backgroundColor: '#EFF6FF',
  },
  activeTab: { backgroundColor: '#2563EB' },
  tabText: { color: '#333', fontWeight: '500' },
  activeTabText: { color: '#fff', fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    margin: 16,
    padding: 22,
    elevation: 2,
  },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  address: { color: '#425066', fontSize: 14, marginBottom: 12 },
  subsection: { marginTop: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#1E293B' },
  deliveredItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6FAFD',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 7,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  deliveredProductName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#19376D',
    marginRight: 10,
  },
  deliveredProductQty: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2563EB',
    marginLeft: 5,
  },
  productList: {
    flexDirection: 'column',
    gap: 10,
    marginVertical: 7,
    marginBottom: 8,
  },
  productCard: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: '#F2F6FE',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 6,
  },
  productCardSelected: {
    backgroundColor: '#E0EFFF',
    borderColor: '#2563EB',
  },
  productName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#19376D',
  },
  productAvailable: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  removeItemButton: {
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  removeItemText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    minWidth: 120,
    backgroundColor: '#F8FAFC',
    fontSize: 15,
  },
  addButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#B3E9CF',
  },
  addButtonText: { color: '#fff', fontWeight: '700' },
  collectButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  collectButtonText: { color: '#fff', fontWeight: '700' },
  paymentStatusRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentStatusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
  },
  removePaymentButton: {
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removePaymentText: {
    color: '#fff',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    marginHorizontal: 18,
    marginTop: 0,
    marginBottom: 20,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonText: { color: '#fff', fontWeight: '700', fontSize: 17, letterSpacing: 0.3 },
});
