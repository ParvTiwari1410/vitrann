import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ProductSummary = { [name: string]: number };

function formatSummaryRows(data: ProductSummary) {
  const rows = Object.entries(data)
    .filter(([_, qty]) => qty !== undefined && qty !== null && Number(qty) > 0)
    .map(([name, qty]) => (
      <View key={name} style={styles.summaryRow}>
        <Text style={styles.productName}>{name}:</Text>
        <Text style={styles.productQty}>{qty} Packets</Text>
      </View>
    ));
  if (rows.length === 0) {
    return <Text style={styles.noProducts}>No products</Text>;
  }
  return rows;
}

function totalPackets(data: ProductSummary) {
  return Object.values(data).reduce((sum, val) => sum + Number(val), 0);
}

export default function DailySummaryScreen() {
  const params = useLocalSearchParams();

  const sent: ProductSummary = params.sent ? JSON.parse(params.sent as string) : {};
  const delivered: ProductSummary = params.delivered ? JSON.parse(params.delivered as string) : {};
  const returned: ProductSummary = params.returned ? JSON.parse(params.returned as string) : {};
  const payments: number = params.payments ? Number(params.payments) : 0;

  const submitDailySummary = () => {
    console.log('Submitting daily summary...', { sent, delivered, returned, payments });
  };

  return (
    <View style={styles.pageBackground}>
      <ScrollView contentContainerStyle={styles.wrapper}>
        <Text style={styles.heading}>Daily Summary</Text>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>Sent:</Text>
          {formatSummaryRows(sent)}
          <Text style={styles.totalText}>Total: {totalPackets(sent)} packets</Text>
        </View>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>Delivered:</Text>
          {formatSummaryRows(delivered)}
          <Text style={styles.totalText}>Total: {totalPackets(delivered)} packets</Text>
        </View>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionLabel}>Returned:</Text>
          {formatSummaryRows(returned)}
          <Text style={styles.totalText}>Total: {totalPackets(returned)} packets</Text>
        </View>

        <View style={[styles.sectionBox, styles.paymentsBox]}>
          <Text style={styles.paymentsLabel}>Payments:</Text>
          <Text style={styles.paymentsValue}>₹{payments}</Text>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={submitDailySummary}>
          <Text style={styles.submitBtnText}>Final Submit for Day</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageBackground: {
    flex: 1,
    backgroundColor: '#F5F6F9',
  },
  wrapper: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 18,
    minHeight: '100%',
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1D223B',
    marginBottom: 20,
    textAlign: 'left',
  },
  sectionBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222831',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B2F43',
  },
  productQty: {
    fontSize: 16,
    fontWeight: '600',
    color: '#297BF6',
  },
  noProducts: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#8B9BB7',
    marginVertical: 6,
  },
  totalText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#16A34A',
    textAlign: 'right',
  },
  paymentsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#F9FFF2',
  },
  paymentsLabel: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#119E49',
  },
  paymentsValue: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#26C45A',
  },
  submitBtn: {
    backgroundColor: '#20C460',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.15,
  },
});





