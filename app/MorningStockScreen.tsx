import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from './AppNavigator';

type MorningStockScreenRouteProp = RouteProp<RootStackParamList, 'MorningStock'>;

const MorningStockScreen = () => {
  const route = useRoute<MorningStockScreenRouteProp>();
  const { workerId } = route.params;

  // Product state
  const [products, setProducts] = useState({
    'गोल्ड 5 (Hole Milk)': '0',
    'गोल्ड 1': '0',
    'गोल्ड 500': '0',
    'स्टैंडर्ड काऊ': '0',
    'स्टैंडर्ड बच्चा': '0',
    'डीटीम': '0',
    'चाह': '0',
    'चाय स्पेशल': '0',
  });

  const handleChange = (name: string, value: string) => {
    setProducts(prev => ({ ...prev, [name]: value }));
  };

  const handleStartDeliveries = () => {
    let summary = Object.entries(products).map(([key, val]) => `${key}: ${val} Packets`).join('\n');
    alert(summary);
  };

  const totalStock = Object.values(products).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome, {workerId}!</Text>
        </View>

        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Morning Stock</Text>
          <View style={styles.headerDivider} />
        </View>

        {/* Product Cards */}
        {Object.entries(products).map(([name, value]) => (
          <View key={name} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{name}</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={(val) => handleChange(name, val)}
                keyboardType="numeric"
                placeholder="0 Packets"
              />
            </View>
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Stock Summary</Text>
          {Object.entries(products).map(([name, value]) => (
            <View key={name} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{name}:</Text>
              <Text style={styles.summaryValue}>{value} Packets</Text>
            </View>
          ))}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Total Stock:</Text>
            <Text style={styles.summaryTotalValue}>{totalStock} Packets</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, totalStock === 0 && styles.buttonDisabled]}
        onPress={handleStartDeliveries}
        activeOpacity={0.9}
        disabled={totalStock === 0}
      >
        <Text style={styles.buttonText}>Start Deliveries</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FC' },
  scrollContent: { padding: 16, paddingBottom: 80 },
  welcomeContainer: { backgroundColor: '#EFF6FF', borderRadius: 8, padding: 10, marginBottom: 16, alignSelf: 'center' },
  welcomeText: { fontSize: 16, fontWeight: '600', color: '#1E40AF', textAlign: 'center' },
  headerContainer: { marginBottom: 16 },
  header: { fontSize: 22, fontWeight: '700', color: '#1A365D', marginBottom: 6 },
  headerDivider: { height: 3, width: 50, backgroundColor: '#4299E1', borderRadius: 3 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#2D3748' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, width: 100, textAlign: 'center', fontSize: 16, color: '#1A365D', borderWidth: 1, borderColor: '#CBD5E0', fontWeight: '600' },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#1A365D', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 14, color: '#4A5568', fontWeight: '500' },
  summaryValue: { fontSize: 14, color: '#2D3748', fontWeight: '600' },
  summaryDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 },
  summaryTotalLabel: { fontSize: 16, fontWeight: '600', color: '#1A365D' },
  summaryTotalValue: { fontSize: 16, fontWeight: '700', color: '#2B6CB0' },
  button: { backgroundColor: '#4299E1', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginHorizontal: 16, marginBottom: 20 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  buttonDisabled: { backgroundColor: '#A0AEC0' }, // disabled button style
});

export default MorningStockScreen;
