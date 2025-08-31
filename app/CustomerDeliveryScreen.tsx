"use client"

import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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

type DeliveredItem = { name: string; qty: number }
type CustomerType = {
  id: string
  name: string
  type: string
  address: string
  deliveredItems: DeliveredItem[]
  paymentReceived: number
}

const PRODUCT_PRICES: Record<string, number> = {
  "गोल्ड 1": 67,
  "गोल्ड 500": 34,
  "गोल्ड 5 (Whole Milk)": 34,
  स्टेण्डर्ड: 31,
  डीटीएम: 26,
  काऊ: 30,
  बच्चा: 10,
  चाह: 60,
  "चाय स्पेशल": 54,
  Delivery: 40,
}

const PRODUCT_ICONS: Record<string, string | any> = {
  "गोल्ड 1": require("../assets/images/Gold1.png"),
  "गोल्ड 500": require("../assets/images/Sanchi Gold3.png"),
  "गोल्ड 5 (Whole Milk)": require("../assets/images/Whole Milk.png"), // Using custom milk carton image
  स्टेण्डर्ड: require("../assets/images/Standard.png"),
  डीटीएम: require("../assets/images/DTM.png"),
  काऊ: require("../assets/images/Cow1.png"),
  बच्चा: require("../assets/images/Bacha.png"),
  चाह: require("../assets/images/Chah.png"),
  "चाय स्पेशल": require("../assets/images/ChaiSpecial1.png"),
  Delivery: "🚚",
}

const ProductIcon = ({ productName, style }: { productName: string; style?: any }) => {
  const icon = PRODUCT_ICONS[productName] || "📦"

  if (typeof icon === "string") {
    return <Text style={[styles.productIcon, style]}>{icon}</Text>
  } else {
    return <Image source={icon} style={[styles.productIconImage, style]} />
  }
}

export default function CustomerDeliveryScreen() {
  const params = useLocalSearchParams() as Record<string, string>
  const router = useRouter()

  const insets = useSafeAreaInsets()

  let productsObj: Record<string, string> = {}
  try {
    productsObj = params.sent ? JSON.parse(params.sent) : {}
  } catch {
    productsObj = {}
  }

  const dynamicProductOptions = Object.entries(productsObj)
    .filter(([_, qty]) => Number(qty) > 0)
    .map(([product]) => product)

  const DEMO_CUSTOMERS: CustomerType[] = [
    {
      id: "1",
      name: "Anand Sweets",
      type: "B2B",
      address: "123, MG Road, Indore",
      deliveredItems: [],
      paymentReceived: 0,
    },
    {
      id: "2",
      name: "Mrs. Sharma",
      type: "B2C",
      address: "45, Scheme 78, Indore",
      deliveredItems: [],
      paymentReceived: 0,
    },
  ]

  const [customers, setCustomers] = useState<CustomerType[]>(DEMO_CUSTOMERS)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [maxConfirmedIdx, setMaxConfirmedIdx] = useState(0)
  const [productQtys, setProductQtys] = useState<Record<string, string>>({})
  const [paymentModalVisible, setPaymentModalVisible] = useState(false)
  const [editingPayment, setEditingPayment] = useState("")
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [isEditingPayment, setIsEditingPayment] = useState(false)

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true)
    })
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      // Add a small delay to ensure keyboard is fully hidden before showing button
      setTimeout(() => {
        setKeyboardVisible(false)
      }, 100)
    })

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  const customer = customers[selectedIdx]
  const productsNotDelivered = dynamicProductOptions.filter(
    (name) => !customer.deliveredItems.find((item) => item.name === name),
  )

  const getTotalDelivered = (productName: string) =>
    customers.reduce(
      (total, cust) =>
        total +
        cust.deliveredItems
          .filter((item) => item.name === productName)
          .reduce((subTotal, item) => subTotal + item.qty, 0),
      0,
    )

  const deliveredObj: Record<string, number> = {}
  dynamicProductOptions.forEach((product) => {
    deliveredObj[product] = getTotalDelivered(product)
  })

  const totalPayments = customers.reduce((sum, cust) => sum + cust.paymentReceived, 0)

  const calculateTotalPayment = (deliveredItems: DeliveredItem[]) => {
    console.log("[v0] Calculating payment for items:", deliveredItems)
    const itemsTotal = deliveredItems.reduce((total, item) => {
      const price = PRODUCT_PRICES[item.name] || 0
      if (!PRODUCT_PRICES[item.name]) {
        console.warn("[v0] WARNING: No price found for product:", item.name)
        Alert.alert("Price Missing", `No price defined for product: ${item.name}. Please contact support.`)
      }
      console.log("[v0] Item:", item.name, "Qty:", item.qty, "Price:", price, "Subtotal:", price * item.qty)
      return total + price * item.qty
    }, 0)

    const deliveryCharges = PRODUCT_PRICES["Delivery"] || 40
    const total = itemsTotal + deliveryCharges
    console.log("[v0] Items total:", itemsTotal, "Delivery charges:", deliveryCharges, "Final total:", total)
    return total
  }

  const autoCalculatedPayment = calculateTotalPayment(customer.deliveredItems)
  console.log("[v0] Auto-calculated payment for customer:", customer.name, "Amount:", autoCalculatedPayment)

  const handleAddItem = (prod: string) => {
    const qtyStr = productQtys[prod]
    if (!qtyStr || Number(qtyStr) <= 0) return Alert.alert("Error", "Enter a valid quantity.")
    const enteredQty = Number(qtyStr)
    const totalDelivered = customer.deliveredItems.filter((i) => i.name === prod).reduce((s, i) => s + i.qty, 0)
    const allowedQty = Number(productsObj[prod])
    if (totalDelivered + enteredQty > allowedQty) {
      return Alert.alert("Stock Exceeded", `Only ${allowedQty - totalDelivered} packets left for ${prod}.`)
    }
    const updatedDeliveredItems = [...customer.deliveredItems, { name: prod, qty: enteredQty }]
    console.log("[v0] Adding item:", prod, "Qty:", enteredQty)
    console.log("[v0] Updated delivered items:", updatedDeliveredItems)
    const updatedCustomers = [...customers]
    updatedCustomers[selectedIdx] = { ...updatedCustomers[selectedIdx], deliveredItems: updatedDeliveredItems }
    setCustomers(updatedCustomers)
    setProductQtys((q) => ({ ...q, [prod]: "" }))
  }

  const handleRemoveItem = (index: number) => {
    Alert.alert("Remove item", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          const updatedDeliveredItems = customer.deliveredItems.filter((_, i) => i !== index)
          const updatedCustomers = [...customers]
          updatedCustomers[selectedIdx] = { ...updatedCustomers[selectedIdx], deliveredItems: updatedDeliveredItems }
          setCustomers(updatedCustomers)
        },
      },
    ])
  }

  const handleEditPayment = () => {
    setEditingPayment(customer.paymentReceived > 0 ? String(customer.paymentReceived) : String(autoCalculatedPayment))
    setIsEditingPayment(true)
    setPaymentModalVisible(true)
  }

  const openPaymentModal = () => {
    setEditingPayment(customer.paymentReceived > 0 ? String(customer.paymentReceived) : "")
    setPaymentModalVisible(true)
  }

  const handleConfirmPayment = () => {
    if (isEditingPayment) {
      const amountToAdd = Number(editingPayment)
      if (isNaN(amountToAdd) || amountToAdd < 0) return Alert.alert("Error", "Enter valid payment.")
      const updatedCustomers = [...customers]
      updatedCustomers[selectedIdx] = { ...updatedCustomers[selectedIdx], paymentReceived: amountToAdd }
      setCustomers(updatedCustomers)
      setIsEditingPayment(false)
    } else {
      // Use auto-calculated payment
      const updatedCustomers = [...customers]
      updatedCustomers[selectedIdx] = { ...updatedCustomers[selectedIdx], paymentReceived: autoCalculatedPayment }
      setCustomers(updatedCustomers)
    }
    setPaymentModalVisible(false)
  }

  const handleTabPress = (idx: number) => {
    if (idx > maxConfirmedIdx) return Alert.alert("Finish this customer", "Complete current delivery first.")
    setSelectedIdx(idx)
  }

  const handleConfirmNext = () => {
    const hasDeliveredItems = customer.deliveredItems.length > 0

    if (!hasDeliveredItems) {
      Alert.alert(
        "No Items Delivered",
        "You have not delivered any items for this customer. Do you still want to proceed?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Yes, Proceed", onPress: () => proceedToNextCustomer() },
        ],
        { cancelable: false },
      )
    } else {
      Alert.alert(
        "Confirm",
        "Are you sure you want to confirm and proceed?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Yes", onPress: () => proceedToNextCustomer() },
        ],
        { cancelable: false },
      )
    }
  }

  const proceedToNextCustomer = () => {
    if (selectedIdx < customers.length - 1) {
      setMaxConfirmedIdx(Math.max(maxConfirmedIdx, selectedIdx + 1))
      setSelectedIdx(selectedIdx + 1)
      setEditingPayment("")
      setPaymentModalVisible(false)
      setProductQtys({})
      setIsEditingPayment(false)
    } else {
      const totalExpectedPayments = customers.reduce((sum, cust) => {
        const customerPayment = calculateTotalPayment(cust.deliveredItems)
        console.log("[v0] Customer:", cust.name, "Expected payment:", customerPayment)
        return sum + customerPayment
      }, 0)

      console.log("[v0] Total expected payments for cash collection:", totalExpectedPayments)

      router.push({
        pathname: "/CashDetailsScreen",
        params: {
          sent: params.sent,
          delivered: JSON.stringify(deliveredObj),
          payments: totalExpectedPayments.toString(),
          maxCashAmount: totalExpectedPayments.toString(),
          products: encodeURIComponent(JSON.stringify(productsObj)),
        },
      })
    }
  }

  const filteredDeliveredItems = customer.deliveredItems.filter((item) => dynamicProductOptions.includes(item.name))

  const isQuantityValid = (product: string, qty: string) => {
    if (!qty || Number(qty) <= 0) return false
    const enteredQty = Number(qty)
    const totalDelivered = customer.deliveredItems.filter((i) => i.name === product).reduce((s, i) => s + i.qty, 0)
    const availableQty = Number(productsObj[product]) - getTotalDelivered(product)
    return enteredQty <= availableQty
  }

  const getAvailableQty = (product: string) => {
    return Number(productsObj[product]) - getTotalDelivered(product)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8F9FA" }} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
          <View style={styles.tabs}>
            {customers.map((c, idx) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.tab, idx === selectedIdx && styles.activeTab]}
                onPress={() => handleTabPress(idx)}
              >
                <Text style={idx === selectedIdx ? styles.activeTabText : styles.tabText}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 140 }}
            keyboardShouldPersistTaps="handled"
            style={{ backgroundColor: "#F8F9FA" }}
          >
            <View style={styles.card}>
              <Text style={styles.name}>
                {customer.name} ({customer.type})
              </Text>
              <Text style={styles.address}>{customer.address}</Text>

              <View style={styles.subsection}>
                <Text style={styles.sectionTitle}>Delivered Items</Text>
                {filteredDeliveredItems.length > 0 ? (
                  filteredDeliveredItems.map((item, idx) => (
                    <View key={idx} style={styles.deliveredItemRow}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={styles.productNameWithIcon}>
                          <ProductIcon productName={item.name} />
                          <Text style={styles.deliveredProductName} numberOfLines={2}>
                            {item.name}
                          </Text>
                        </View>
                        <Text style={styles.deliveredProductQty}>{item.qty} Pkt</Text>
                      </View>
                      <TouchableOpacity style={styles.removeItemButton} onPress={() => handleRemoveItem(idx)}>
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
                {productsNotDelivered.length > 0 ? (
                  productsNotDelivered.map((option) => {
                    const availableQty = getAvailableQty(option)
                    const currentQty = productQtys[option] || ""
                    const isValid = isQuantityValid(option, currentQty)
                    const hasValue = currentQty && Number(currentQty) > 0
                    const exceedsStock = hasValue && Number(currentQty) > availableQty

                    return (
                      <View key={option} style={styles.productCard}>
                        <View style={styles.productNameWithIcon}>
                          <ProductIcon productName={option} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.productName}>{option}</Text>
                            <Text style={styles.productAvailable}>Available: {availableQty}</Text>
                          </View>
                        </View>
                        <View style={styles.row}>
                          <TextInput
                            style={[styles.input, { flex: 1 }, exceedsStock && styles.inputError]}
                            value={currentQty}
                            placeholder="Qty"
                            onChangeText={(qty) => {
                              const numQty = Number(qty)
                              if (qty === "" || (numQty >= 0 && numQty <= availableQty)) {
                                setProductQtys((q) => ({ ...q, [option]: qty }))
                              }
                            }}
                            keyboardType="numeric"
                            maxLength={availableQty.toString().length + 1}
                          />
                          <TouchableOpacity
                            style={[styles.addButton, (!hasValue || !isValid) && styles.addButtonDisabled]}
                            onPress={() => handleAddItem(option)}
                            disabled={!hasValue || !isValid}
                          >
                            <Text style={styles.addButtonText}>Add</Text>
                          </TouchableOpacity>
                        </View>
                        {exceedsStock && <Text style={styles.errorText}>Maximum {availableQty} packets available</Text>}
                      </View>
                    )
                  })
                ) : (
                  <Text>No available products to add.</Text>
                )}
              </View>

              {customer.type === "B2B" && (
                <View style={styles.subsection}>
                  <Text style={styles.sectionTitle}>Collect Payment</Text>
                  <View style={styles.paymentContainer}>
                    <View style={styles.paymentAmountContainer}>
                      <Text style={styles.paymentLabel}>Total Amount:</Text>
                      <Text style={styles.paymentAmount}>₹{autoCalculatedPayment}</Text>
                    </View>
                    <View style={styles.paymentButtonsContainer}>
                      <TouchableOpacity style={styles.confirmPaymentButton} onPress={handleConfirmPayment}>
                        <Text style={styles.confirmPaymentButtonText}>Confirm</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.editPaymentButton} onPress={handleEditPayment}>
                        <Text style={styles.editPaymentButtonText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {customer.paymentReceived > 0 && (
                    <Text style={styles.paymentReceivedText}>✓ ₹{customer.paymentReceived} confirmed</Text>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          <Modal
            visible={paymentModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setPaymentModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalHeading}>
                  {isEditingPayment ? "Edit Payment Amount" : "Confirm Payment Amount"}
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={editingPayment}
                  onChangeText={setEditingPayment}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  autoFocus
                />
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => {
                      setPaymentModalVisible(false)
                      setIsEditingPayment(false)
                    }}
                  >
                    <Text style={{ color: "#2563EB", fontWeight: "bold" }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirmPayment}>
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {!keyboardVisible && (
            <View style={[styles.fixedButtonContainer, { bottom: insets.bottom + 10 }]}>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmNext}>
                <Text style={styles.confirmButtonText}>Confirm & Next</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fixedButtonContainer: {
    position: "absolute",
    left: 18,
    right: 18,
    zIndex: 100,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    padding: 16,
    width: "90%",
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  tabs: {
    flexDirection: "row",
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 7,
    marginHorizontal: 3,
    backgroundColor: "#EFF6FF",
  },
  activeTab: { backgroundColor: "#2563EB" },
  tabText: { color: "#333", fontWeight: "500" },
  activeTabText: { color: "#fff", fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    margin: 16,
    padding: 22,
    elevation: 2,
  },
  name: { fontSize: 22, fontWeight: "bold", marginBottom: 2 },
  address: { color: "#425066", fontSize: 14, marginBottom: 12 },
  subsection: { marginTop: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: "#1E293B" },
  deliveredItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F6FAFD",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 7,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  deliveredProductName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#19376D",
    marginBottom: 2,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  deliveredProductQty: {
    fontSize: 16,
    fontWeight: "700",
    color: "#297BF6",
    marginBottom: 2,
  },
  productList: {
    flexDirection: "column",
    gap: 10,
    marginVertical: 7,
    marginBottom: 8,
  },
  productCard: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: "#F2F6FE",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    marginBottom: 10,
  },
  productCardSelected: {
    backgroundColor: "#E0EFFF",
    borderColor: "#2563EB",
  },
  productName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#19376D",
  },
  productAvailable: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "600",
  },
  removeItemButton: {
    backgroundColor: "#EF4444",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  removeItemText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  row: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    minWidth: 80,
    backgroundColor: "#F8FAFC",
    fontSize: 15,
  },
  addButton: {
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  addButtonDisabled: {
    backgroundColor: "#B3E9CF",
  },
  addButtonText: { color: "#fff", fontWeight: "700" },
  collectButton: {
    backgroundColor: "#F59E0B",
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginRight: 10,
  },
  collectButtonText: { color: "#fff", fontWeight: "700" },
  paymentSummaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0D9488",
  },
  paymentStatusRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentStatusText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16A34A",
  },
  removePaymentButton: {
    backgroundColor: "#EF4444",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removePaymentText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 22,
    width: "100%",
  },
  modalHeading: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#F8FAFC",
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  modalConfirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#2563EB",
  },
  inputError: {
    borderColor: "#EF4444",
    borderWidth: 2,
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  paymentContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  paymentAmountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#059669",
  },
  paymentButtonsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  confirmPaymentButton: {
    flex: 1,
    backgroundColor: "#059669",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  confirmPaymentButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  editPaymentButton: {
    flex: 1,
    backgroundColor: "#F59E0B",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  editPaymentButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  paymentReceivedText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    marginTop: 8,
    textAlign: "center",
  },
  productNameWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  productIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  productIconImage: {
    width: 20,
    height: 20,
    marginRight: 8,
    resizeMode: "contain",
  },
})
