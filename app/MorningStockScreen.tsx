"use client"

import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

const MorningStockScreen = () => {
  const params = useLocalSearchParams()
  const router = useRouter()

  const insets = useSafeAreaInsets()
  const workerId = (params.workerId as string) || ""

  const [products, setProducts] = useState<Record<string, string>>({
    "गोल्ड 1": "0",
    "गोल्ड 5 (Whole Milk)": "0",
    "गोल्ड 500": "0",
    स्टेण्डर्ड: "0",
    काऊ: "0",
    बच्चा: "0",
    डीटीएम: "0",
    चाह: "0",
    "चाय स्पेशल": "0",
  })

  const [currentDate, setCurrentDate] = useState("")
  const [keyboardVisible, setKeyboardVisible] = useState(false) // 🔹 new

  useEffect(() => {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    setCurrentDate(now.toLocaleDateString(undefined, options))
  }, [])

  // 🔹 Keyboard listeners to prevent layout jump when returning to the app
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true))
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false))

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  const handleChange = (name: string, value: string) => {
    setProducts((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const totalStock = Object.values(products).reduce((sum, val) => sum + (Number.parseFloat(val) || 0), 0)

  const getProductSummary = () => {
    const summaryArr = Object.entries(products)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([name, qty]) => `• ${name}: ${qty} Packets`)
    return summaryArr.length ? summaryArr.join("\n") : "No packets entered for any product"
  }

  const handleStartDeliveries = () => {
    if (totalStock === 0) return

    Alert.alert(
      "Confirm Morning Stock",
      `Are you sure you want to proceed with these products?\n\n${getProductSummary()}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Proceed",
          style: "default",
          onPress: () => {
            router.push({
              pathname: "/CustomerDeliveryScreen",
              params: {
                workerId,
                sent: JSON.stringify(products),
              },
            })
          },
        },
      ],
      { cancelable: false },
    )
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top"]} // Only handle top edge to avoid conflicts
    >
      <StatusBar style="dark" backgroundColor="#F5F9FC" translucent={false} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"} // Simplified keyboard behavior
      >
        {/* 🔹 Top fixed section */}
        <View style={styles.topSection}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome, {workerId}!</Text>
          </View>

          <View style={styles.dateContainer}>
            <MaterialCommunityIcons name="calendar-month" size={18} color="#1E40AF" style={{ marginRight: 4 }} />
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.header}>Morning Stock</Text>
            <View style={styles.headerDivider} />
          </View>
        </View>

        {/* 🔹 Middle scrollable content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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

        {/* 🔹 Bottom fixed button */}
        <View style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom + 20 }]}>
          {" "}
          {/* Use dynamic insets.bottom */}
          <TouchableOpacity
            style={[styles.button, totalStock === 0 && styles.buttonDisabled]}
            onPress={handleStartDeliveries}
            activeOpacity={0.9}
            disabled={totalStock === 0}
          >
            <Text style={styles.buttonText}>Start Deliveries</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F9FC" },
  topSection: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
  },
  welcomeContainer: {
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
    alignSelf: "center",
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E40AF",
    textAlign: "center",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    color: "#4C51BF",
    fontWeight: "700",
    fontStyle: "italic",
    letterSpacing: 0.4,
  },
  headerContainer: { marginBottom: 16 },
  header: { fontSize: 22, fontWeight: "700", color: "#1A365D", marginBottom: 6 },
  headerDivider: { height: 3, width: 50, backgroundColor: "#4299E1", borderRadius: 3 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#2D3748" },
  inputContainer: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    width: 100,
    textAlign: "center",
    fontSize: 16,
    color: "#1A365D",
    borderWidth: 1,
    borderColor: "#CBD5E0",
    fontWeight: "600",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  summaryTitle: { fontSize: 18, fontWeight: "700", color: "#1A365D", marginBottom: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summaryLabel: { fontSize: 14, color: "#4A5568", fontWeight: "500" },
  summaryValue: { fontSize: 14, color: "#2D3748", fontWeight: "600" },
  summaryDivider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 8 },
  summaryTotalLabel: { fontSize: 16, fontWeight: "600", color: "#1A365D" },
  summaryTotalValue: { fontSize: 16, fontWeight: "700", color: "#2B6CB0" },
  bottomButtonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    backgroundColor: "#F5F9FC",
  },
  button: {
    backgroundColor: "#4299E1",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginHorizontal: 16,
    width: "90%",
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
  buttonDisabled: { backgroundColor: "#A0AEC0" },
})

export default MorningStockScreen



