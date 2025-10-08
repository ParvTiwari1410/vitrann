"use client"

import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

// Updated interface to match your API response
interface Product {
  productId: number
  productName: string
  currentProductPrice: string
  lastProductPrice: string
  imageUrl: string
  description: string
  storeId: string
  inventory: {
    inventoryId: number
    date: string
  }
}

const MorningStockScreen = () => {
  const params = useLocalSearchParams()
  const router = useRouter()
  const workerId = params.workerId as string

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

  const [products, setProducts] = useState<Product[]>([])
  const [quantities, setQuantities] = useState<{[key: number]: string}>({}) // Key is inventoryId now
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [workerName, setWorkerName] = useState('')

  // Fetch worker name and products on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const name = await AsyncStorage.getItem('workerName')
        setWorkerName(name || `Worker ${workerId}`)
        setLoading(true)
        const token = await AsyncStorage.getItem('authToken')
        const response = await fetch(`${API_BASE_URL}/products/products-with-latest-inventory`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        })
        const result = await response.json()
        if (result.success && Array.isArray(result.data)) {
          // ✅ SAFETY CHECK: Filter out products without inventory
// ✅ FIXED: Properly typed parameter
const validProducts = result.data.filter((p: Product) => p && p.inventory && p.inventory.inventoryId)
          setProducts(validProducts)
          
          // Initialize quantities using inventoryId as key
          const initial: {[key: number]: string} = {}
          validProducts.forEach((p: Product) => {
            initial[p.inventory.inventoryId] = '' // ✅ Use inventoryId as key
          })
          setQuantities(initial)
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to load products',
          })
        }
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Network error while loading products',
        })
      }
      setLoading(false)
    }
    loadData()
  }, [])

  // Live total calculation
  useEffect(() => {
    const sum = Object.values(quantities)
      .map(q => parseInt(q) || 0)
      .reduce((acc, val) => acc + val, 0)
    setTotal(sum)
  }, [quantities])

  // Handle input change for each inventory item
  const handleInputChange = (inventoryId: number, text: string) => {
    // Only allow numbers, max 3 digits
    let cleaned = text.replace(/[^0-9]/g, '').slice(0, 3)
    setQuantities(prev => ({
      ...prev,
      [inventoryId]: cleaned // ✅ Use inventoryId as key
    }))
  }

  // Submit quantities to backend
  const handleSubmit = async () => {
    if (total === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter quantity for at least one product.',
      })
      return
    }
    setSubmitting(true)
    try {
      const token = await AsyncStorage.getItem('authToken')
      
      // Create pickItems using correct inventoryId
      const pickItems = Object.entries(quantities)
        .filter(([_, qty]) => (parseInt(qty) || 0) > 0)
        .map(([inventoryId, qty]) => ({
          inventoryId: parseInt(inventoryId), // ✅ inventoryId is already correct
          totalPickedQuantity: parseInt(qty)
        }))

      console.log('Submitting pick items:', pickItems) // Debug log
      
      const response = await fetch(`${API_BASE_URL}/daily-activity-wi/pick-quantities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          workerId: parseInt(workerId),
          pickItems
        })
      })
      
      const result = await response.json()
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: result.message || 'Stock submitted successfully!',
        })
        // Navigate after a short delay so user sees the toast
        setTimeout(() => {
          router.push({
            pathname: '/CustomerDeliveryScreen',
            params: { workerId, workerName }
          })
        }, 1200)
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.message || 'Submission failed',
        })
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Network error during submission',
      })
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </SafeAreaView>
    )
  }

  if (products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products available</Text>
          <Text style={styles.emptySubtext}>Contact admin to add products to inventory</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Text style={styles.welcome}>Welcome, {workerName}!</Text>
        <Text style={styles.title}>Morning Stock</Text>
        <Text style={styles.subtitle}>Select quantities to pick for delivery</Text>
        
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          {products.map((product) => (
            <View key={product.inventory.inventoryId} style={styles.card}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.productName}</Text>
                <Text style={styles.productPrice}>₹{product.currentProductPrice}</Text>
                <Text style={styles.storeId}>{product.storeId}</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="numeric"
                  maxLength={3}
                  value={quantities[product.inventory.inventoryId] ?? ''} // ✅ Use inventoryId
                  onChangeText={(text) => handleInputChange(product.inventory.inventoryId, text)} // ✅ Use inventoryId
                  editable={!submitting}
                />
                <Text style={styles.packetsLabel}>Packets</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total: {total} Packets</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || total === 0}
        >
          <Text style={styles.buttonText}>
            {submitting ? 'Submitting...' : `Start Delivery (${total})`}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#f5f5f5' 
  },
  
  welcome: { 
    fontSize: 18, 
    textAlign: 'center', 
    marginBottom: 10, 
    color: '#333',
    fontWeight: '600'
  },
  
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 8,
    color: '#007AFF'
  },
  
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666'
  },
  
  scroll: { 
    flex: 1 
  },
  
  card: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  
  productName: { 
    fontSize: 16, 
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  
  productPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 2
  },
  
  storeId: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500'
  },
  
  inputContainer: {
    alignItems: 'center',
  },
  
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    width: 60,
    textAlign: 'center',
    marginBottom: 4,
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    fontWeight: '600'
  },
  
  packetsLabel: {
    fontSize: 12,
    color: '#666'
  },
  
  totalCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    elevation: 3,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  
  totalLabel: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    color: '#007AFF' 
  },
  
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  buttonText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  
  buttonDisabled: { 
    backgroundColor: '#999' 
  },
  
  loadingText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
})

export default MorningStockScreen
