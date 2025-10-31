"use client"

import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import Toast from 'react-native-toast-message'
import { ProductDeliveryModal } from "./CDS/ProductDeliveryModal"

// Updated Types with tracking
type DeliveredItem = {
  name: string;
  qty: number;
  productId: number;
  price: number;        // This is now TOTAL amount per item, not per unit
  originalPrice: number; // Original per-unit price
  isEdited: boolean;     // Track if user edited the total
}

type Customer = {
  id: number
  workerId: number
  customerId: number
  fromDate: string
  sequenceNumber: number
  thruDate: string | null
  customer: {
    customerId: number
    firstName: string
    lastName: string | null
    address1: string
    address2: string | null
    phoneNumber: string | null
    city: string | null
    pincode: string | null
    classification: string
  }
}

type WorkerInventory = {
  id: number
  workerId: number
  inventoryId: number
  totalPickedQuantity: number | null
  remainingQuantity: number | null
  date: string
  inventory: {
    inventoryId: number
    totalOrderedQuantity: number
    receivedQuantity: number | null
    remainingQuantity: number | null
    date: string
    product: {
      productId: number
      productName: string
      currentProductPrice: number
      storeId: string
      imageUrl: string | null
      description: string | null
    }
  }
}

type CustomerForDelivery = {
  id: string
  name: string
  type: string
  address: string
  deliveredItems: DeliveredItem[]
  paymentReceived: number
  customerId: number
  deliveryConfirmed: boolean
  sequenceNumber: number
}

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL ?? 'https://theinfranova.com/api';

const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const token = await AsyncStorage.getItem('authToken')
    if (!token) {
      throw new Error('No authentication token found')
    }

    if (!API_BASE_URL) {
      throw new Error('API base URL is not configured.')
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

const processDeliveryRequest = async (deliveryData: any) => {
  console.log(API_BASE_URL)
  try {
    const response = await makeAuthenticatedRequest('/deliveries/process', {
      method: 'POST',
      body: JSON.stringify(deliveryData),
    })
    return response
  } catch (error) {
    console.error('Delivery processing failed:', error)
    throw error
  }
}

export default function CustomerDeliveryScreen() {
  const params = useLocalSearchParams() as Record<string, string>
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [customers, setCustomers] = useState<CustomerForDelivery[]>([])
  const [workerInventory, setWorkerInventory] = useState<WorkerInventory[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [productDeliveryModal, setProductDeliveryModal] = useState(false)
  const [processingDelivery, setProcessingDelivery] = useState(false)

  useEffect(() => {
    fetchDataFromAPI()
  }, [])

  const fetchDataFromAPI = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!API_BASE_URL) {
        setError('API configuration missing.')
        return
      }

      const customersResponse = await makeAuthenticatedRequest('/daily-activity-ci/my-customers')
      const inventoryResponse = await makeAuthenticatedRequest('/daily-activity-ci/my-inventory')

      if (customersResponse.success && inventoryResponse.success) {
        const sortedCustomers = customersResponse.data.sort((a: Customer, b: Customer) => 
          a.sequenceNumber - b.sequenceNumber
        )

        const transformedCustomers: CustomerForDelivery[] = sortedCustomers.map((item: Customer) => ({
          id: item.customer.customerId.toString(),
          name: `${item.customer.firstName} ${item.customer.lastName || ''}`.trim(),
          type: item.customer.classification === 'B2B' ? 'B2B' : 'B2C',
          address: `${item.customer.address1}${item.customer.address2 ? ', ' + item.customer.address2 : ''}, ${item.customer.city || ''} ${item.customer.pincode || ''}`.trim(),
          deliveredItems: [],
          paymentReceived: 0,
          customerId: item.customer.customerId,
          deliveryConfirmed: false,
          sequenceNumber: item.sequenceNumber
        }))

        setCustomers(transformedCustomers)
        setWorkerInventory(inventoryResponse.data)

        Toast.show({
          type: 'success',
          text1: 'Ready for Delivery',
          text2: `${transformedCustomers.length} customers loaded`,
          visibilityTime: 2000,
        })
      } else {
        throw new Error('Failed to fetch data from API')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data from server.')

      Toast.show({
        type: 'error',
        text1: 'Data Load Failed',
        text2: 'Unable to load customers and inventory',
        visibilityTime: 3000,
      })

      setCustomers([])
      setWorkerInventory([])
    } finally {
      setLoading(false)
    }
  }

  const customer = customers[selectedIdx]

  const handleTabPress = (idx: number) => {
    setSelectedIdx(idx)
  }

  // Handle per-item TOTAL amount change (not per-unit price)
  const handleItemTotalChange = (itemIndex: number, newTotal: string) => {
    const totalAmount = Number(newTotal) || 0
    
    const updatedCustomers = [...customers]
    const updatedItems = [...customer.deliveredItems]
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      price: totalAmount,  // This is now the TOTAL amount for this item
      isEdited: true       // Mark as edited
    }
    
    updatedCustomers[selectedIdx] = {
      ...updatedCustomers[selectedIdx],
      deliveredItems: updatedItems
    }
    
    setCustomers(updatedCustomers)
  }

  // Calculate total payment from all items (items.price is already total per item)
  const calculateTotalPayment = (deliveredItems: DeliveredItem[]) => {
    return deliveredItems.reduce((total, item) => total + item.price, 0)
  }

  // Calculate correct bill amount based on editing status
  const calculateBillAmount = (item: DeliveredItem) => {
    if (item.isEdited) {
      // If edited, use the edited amount directly (no multiplication)
      return item.price
    } else {
      // If not edited, calculate: original_price * quantity
      return item.originalPrice * item.qty
    }
  }

  const confirmDelivery = async () => {
    const hasDeliveredItems = customer.deliveredItems.length > 0
    
    if (selectedIdx === customers.length - 1) {
      if (hasDeliveredItems) {
        await processCurrentDelivery()
      }
      
      const deliveryData = customers.map(customer => ({
        customerId: customer.customerId,
        deliveredItems: customer.deliveredItems,
        paymentReceived: customer.paymentReceived,
        deliveryConfirmed: customer.deliveryConfirmed
      }))

      router.push({
        pathname: "/CashDetailsScreen",
        params: {
          deliveryData: JSON.stringify(deliveryData),
          totalPayments: customers.reduce((sum, cust) => sum + cust.paymentReceived, 0).toString(),
        },
      })
      return
    }

    if (hasDeliveredItems) {
      await processCurrentDelivery()
    } else {
      Toast.show({
        type: 'info',
        text1: 'No Items',
        text2: 'Moving to next customer',
        visibilityTime: 1500,
      })
    }

    setSelectedIdx(selectedIdx + 1)
  }

  const processCurrentDelivery = async () => {
    if (customer.deliveryConfirmed) return

    setProcessingDelivery(true)

    try {
      Toast.show({
        type: 'info',
        text1: 'Processing...',
        text2: `Confirming delivery for ${customer.name}`,
        visibilityTime: 2000,
      })

      // Process each item with correct calculation
      for (const item of customer.deliveredItems) {
        const inventoryItem = workerInventory.find(inv => 
          inv.inventory?.product.productId === item.productId
        )
        
        if (inventoryItem) {
          const deliveryDto = {
            customerId: customer.customerId,
            inventoryId: inventoryItem.inventoryId,
            deliveredQuantity: item.qty,
            billAmount: calculateBillAmount(item), // ✅ CORRECT CALCULATION
            isPriceCustomized: item.isEdited       // ✅ FLAG FOR BACKEND
          }

          const response = await processDeliveryRequest(deliveryDto)
          
          if (!response.success && !response.isDuplicate) {
            throw new Error(`Failed to process ${item.name}: ${response.message}`)
          }
        }
      }

      const updatedCustomers = [...customers]
      updatedCustomers[selectedIdx] = { 
        ...updatedCustomers[selectedIdx], 
        deliveryConfirmed: true,
        paymentReceived: calculateTotalPayment(customer.deliveredItems)
      }
      setCustomers(updatedCustomers)

      Toast.show({
        type: 'success',
        text1: 'Delivery Confirmed',
        text2: `${customer.name}'s delivery processed`,
        visibilityTime: 2000,
      })

    } catch (error) {
      console.error('Delivery processing error:', error)
      
      Toast.show({
        type: 'error',
        text1: 'Processing Failed',
        text2: 'Server error occurred',
        visibilityTime: 3000,
      })
    } finally {
      setProcessingDelivery(false)
    }
  }

  const getDeliveryProgress = () => {
    const completed = selectedIdx
    const total = customers.length
    return { completed, total }
  }

  // Loading and Error screens remain the same...
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading delivery route...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || customers.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {!API_BASE_URL ? 'API Configuration Missing' : error || 'No customers assigned'}
          </Text>
          
          {!API_BASE_URL ? (
            <Text style={styles.configInstructions}>
              Create a .env file with EXPO_PUBLIC_API_BASE_URL
            </Text>
          ) : (
            <TouchableOpacity style={styles.retryButton} onPress={fetchDataFromAPI}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    )
  }

  const progress = getDeliveryProgress()
  const totalPayment = calculateTotalPayment(customer.deliveredItems)

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>
          Delivery {progress.completed + 1} of {progress.total}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${((progress.completed) / progress.total) * 100}%` }]} 
          />
        </View>
      </View>
      
      {/* Customer Navigation Tabs - NO SEQUENCE NUMBERS */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {customers.map((c, idx) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.tab, 
                selectedIdx === idx && styles.activeTab,
                c.deliveryConfirmed && styles.confirmedTab
              ]}
              onPress={() => handleTabPress(idx)}
            >
              <Text style={[
                styles.tabText, 
                selectedIdx === idx && styles.activeTabText,
                c.deliveryConfirmed && styles.confirmedTabText
              ]}>
                {c.deliveryConfirmed ? '✓ ' : ''}{c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={styles.card}>
            {/* Customer Info */}
            <View style={styles.customerCard}>
              <View style={styles.customerHeader}>
                <Text style={styles.name}>{customer.name}</Text>
                {customer.deliveryConfirmed && (
                  <View style={styles.confirmedBadge}>
                    <Text style={styles.confirmedBadgeText}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={styles.address}>{customer.address}</Text>
            </View>

            {/* Items with Individual Editable Totals - MOBILE OPTIMIZED */}
{customer.deliveredItems.length > 0 && (
  <View style={styles.subsection}>
    <Text style={styles.sectionTitle}>Items ({customer.deliveredItems.length})</Text>
    <View style={styles.itemsContainer}>
      {customer.deliveredItems.map((item, idx) => (
        <View key={idx} style={styles.itemCard}>
          {/* Product Name - Full Width */}
          <Text style={styles.itemName}>{item.name}</Text>
          
          {/* Quantity and Price in Responsive Row */}
          <View style={styles.itemDetailsRow}>
            {/* Quantity Section - Takes 60% of width */}
            <View style={styles.quantitySection}>
              <Text style={styles.detailLabel}>Quantity:</Text>
              <Text style={styles.quantityValue}>{item.qty} packets</Text>
            </View>
            
            {/* Price Section - Takes 40% of width */}
            <View style={styles.priceSection}>
              <Text style={styles.detailLabel}>Total:</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.rupeeSymbol}>₹</Text>
                <TextInput
                  style={[
                    styles.responsivePriceInput,
                    customer.deliveryConfirmed && styles.priceInputDisabled
                  ]}
                  value={item.price.toString()}
                  placeholder={`${item.originalPrice * item.qty}`}
                  onChangeText={(newTotal) => handleItemTotalChange(idx, newTotal)}
                  keyboardType="numeric"
                  editable={!customer.deliveryConfirmed}
                />
              </View>
            </View>
          </View>
        </View>
      ))}
      
      {/* Grand Total */}
      <View style={styles.grandTotalContainer}>
        <Text style={styles.grandTotalLabel}>Grand Total:</Text>
        <Text style={styles.grandTotalAmount}>₹{totalPayment}</Text>
      </View>
    </View>
  </View>
)}

            {/* Add Products Button */}
            <TouchableOpacity
              style={[
                styles.addProductsButton,
                customer.deliveryConfirmed && styles.addProductsButtonDisabled
              ]}
              onPress={() => setProductDeliveryModal(true)}
              disabled={customer.deliveryConfirmed}
            >
              <Text style={styles.addProductsButtonText}>
                {customer.deliveryConfirmed ? '✓ Products Confirmed' : '📦 Add Products'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Product Delivery Modal */}
      <ProductDeliveryModal
        visible={productDeliveryModal}
        customer={customer}
        customers={customers}
        setCustomers={setCustomers}
        selectedIdx={selectedIdx}
        workerInventory={workerInventory}
        onClose={() => setProductDeliveryModal(false)}
      />

      {/* Single Confirm Button */}
      <View style={[styles.fixedButtonContainer, { bottom: insets.bottom + 20 }]}>
        <TouchableOpacity 
          style={[
            styles.confirmButton,
            processingDelivery && styles.confirmButtonProcessing
          ]} 
          onPress={confirmDelivery}
          disabled={processingDelivery}
        >
          <Text style={styles.confirmButtonText}>
            {processingDelivery 
              ? 'Processing...' 
              : selectedIdx === customers.length - 1 
                ? 'Complete All Deliveries' 
                : 'Confirm & Next Customer'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

// Styles remain exactly the same as before...
const styles = StyleSheet.create({
  // ... all existing styles remain the same
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  
  errorText: {
    color: "#EF4444",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },
  
  retryButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  
  configInstructions: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontFamily: "monospace",
    lineHeight: 20,
  },

  itemsContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  itemName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    lineHeight: 24,
    // ✅ FIXED: No width constraints that could cause wrapping
    flexShrink: 1,
    flexGrow: 1,
  },

  itemDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start", // Changed to flex-start to prevent height issues
    // ✅ RESPONSIVE: Use percentage-based widths
  },

  quantitySection: {
    // ✅ RESPONSIVE: Takes 60% of available width
    flex: 3,
    marginRight: 12, // Space between sections
  },

  priceSection: {
    // ✅ RESPONSIVE: Takes 40% of available width
    flex: 2,
    alignItems: "flex-end",
  },

  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },

  quantityValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    // ✅ FIXED: Ensure text doesn't wrap
    flexShrink: 0,
  },

  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#D1FAE5",
    paddingHorizontal: 8, // ✅ REDUCED: Less padding for smaller screens
    paddingVertical: 8,
    // ✅ RESPONSIVE: Use flexible width instead of fixed minWidth
    width: "100%", // Take full width of parent (40% of row)
    maxWidth: 120, // ✅ MAXIMUM width to prevent it from getting too large
  },

  rupeeSymbol: {
    fontSize: 16, // ✅ SMALLER: Reduced size for mobile
    fontWeight: "700",
    color: "#059669",
    marginRight: 4,
    // ✅ FIXED: Prevent shrinking
    flexShrink: 0,
  },

  responsivePriceInput: {
    fontSize: 16, // ✅ SMALLER: Better for mobile
    fontWeight: "700",
    color: "#059669",
    textAlign: "right",
    // ✅ RESPONSIVE: Take remaining space
    flex: 1,
    padding: 0,
    margin: 0,
    // ✅ FIXED: Ensure it doesn't overflow
    minWidth: 0, // Allow it to shrink if needed
  },

  priceInputDisabled: {
    color: "#9CA3AF",
    backgroundColor: "transparent",
  },

  grandTotalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: "#2563EB",
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  grandTotalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E40AF",
    // ✅ RESPONSIVE: Allow text to take needed space
    flex: 1,
  },

  grandTotalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2563EB",
    // ✅ FIXED: Prevent shrinking
    flexShrink: 0,
  },

  progressHeader: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#DBEAFE",
  },

  progressText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E40AF",
    textAlign: "center",
    marginBottom: 8,
  },

  progressBar: {
    height: 4,
    backgroundColor: "#DBEAFE",
    borderRadius: 2,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 2,
  },

  tabsContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingVertical: 12,
  },
  
  tabs: {
    paddingLeft: 16,
  },
  
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  
  activeTab: { 
    backgroundColor: "#2563EB" 
  },

  confirmedTab: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
    borderWidth: 1,
  },
  
  tabText: { 
    color: "#333", 
    fontWeight: "500",
    fontSize: 14,
    textAlign: "center",
  },
  
  activeTabText: { 
    color: "#fff", 
    fontWeight: "700" 
  },

  confirmedTabText: {
    color: "#059669",
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    margin: 16,
    padding: 22,
    elevation: 2,
  },

  customerCard: {
    marginBottom: 20,
  },

  customerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  
  name: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#1E293B",
    flex: 1,
  },

  confirmedBadge: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  confirmedBadgeText: {
    color: "#059669",
    fontSize: 16,
    fontWeight: "700",
  },
  
  address: { 
    color: "#64748B", 
    fontSize: 16, 
    lineHeight: 22
  },
  
  subsection: { 
    marginTop: 24 
  },
  
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    marginBottom: 12, 
    color: "#1E293B" 
  },

  itemPriceInput: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
    textAlign: "center",
    minWidth: 60,
    padding: 0,
    flex: 1, // ✅ ADD: Take remaining space in price container
  },
  
  itemPriceInputDisabled: {
    color: "#9CA3AF",
    backgroundColor: "#F9FAFB",
  },

  addProductsButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    padding: 18,
    alignItems: "center",
    marginTop: 20,
  },

  addProductsButtonDisabled: {
    backgroundColor: "#10B981",
  },
  
  addProductsButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 18,
  },

  totalPaymentContainer: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: "#2563EB",
    alignItems: "center",
  },
  
  totalPaymentAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2563EB",
    marginBottom: 4,
  },
  
  totalPaymentLabel: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },

  fixedButtonContainer: {
    position: "absolute",
    left: 18,
    right: 18,
    zIndex: 100,
  },
  
  confirmButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  confirmButtonProcessing: {
    backgroundColor: "#F59E0B",
  },
  
  confirmButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 18,
  },


  quantityLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },

  priceLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },

  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120, // Fixed width for price input
  },

  priceInput: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
    textAlign: "right",
    flex: 1,
    padding: 0,
    margin: 0,
  },
  
})
