"use client"

import { useLocalSearchParams, useRouter } from "expo-router"
import { useMemo, useState } from "react"
import {
  Alert,
  Image,
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

const notes = [
  { label: "₹500", value: 500, color: "#87CEEB" },
  { label: "₹200", value: 200, color: "#87CEEB" },
  { label: "₹100", value: 100, color: "#87CEEB" },
  { label: "₹50", value: 50, color: "#87CEEB" },
  { label: "₹20", value: 20, color: "#87CEEB" },
  { label: "₹10", value: 10, color: "#87CEEB" },
]

const coins = [
  { label: "₹10 (Coin)", value: 10, color: "#87CEEB" },
  { label: "₹5", value: 5, color: "#87CEEB" },
  { label: "₹2", value: 2, color: "#87CEEB" },
  { label: "₹1", value: 1, color: "#87CEEB" },
]

export default function CashDetailsScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()

  const insets = useSafeAreaInsets()

  const maxCashAmount = params.maxCashAmount ? Number(params.maxCashAmount) : 0

  const [noteCounts, setNoteCounts] = useState<Record<string, string>>({})
  const [coinCounts, setCoinCounts] = useState<Record<string, string>>({})

  const computeTotal = (notesObj: Record<string, string>, coinsObj: Record<string, string>) => {
    let total = 0
    Object.entries(notesObj).forEach(([label, val]) => {
      const note = notes.find((n) => n.label === label)
      if (note) total += note.value * (Number(val) || 0)
    })
    Object.entries(coinsObj).forEach(([label, val]) => {
      const coin = coins.find((c) => c.label === label)
      if (coin) total += coin.value * (Number(val) || 0)
    })
    return total
  }

  const totalAmount = useMemo(() => computeTotal(noteCounts, coinCounts), [noteCounts, coinCounts])

  const onChangeCount = (type: "note" | "coin", label: string, value: string) => {
    const filtered = value.replace(/[^0-9]/g, "")
    if (!filtered) {
      if (type === "note") setNoteCounts((prev) => ({ ...prev, [label]: "" }))
      else setCoinCounts((prev) => ({ ...prev, [label]: "" }))
      return
    }
    const valInt = Number(filtered)
    if (isNaN(valInt)) return

    const tempNotes = { ...noteCounts }
    const tempCoins = { ...coinCounts }
    if (type === "note") tempNotes[label] = filtered
    else tempCoins[label] = filtered

    const newTotal = computeTotal(tempNotes, tempCoins)
    if (newTotal > maxCashAmount) {
      Alert.alert("Limit exceeded", `Total cash cannot exceed ₹${maxCashAmount}.`)
      return
    }

    if (type === "note") setNoteCounts(tempNotes)
    else setCoinCounts(tempCoins)
  }

  const onNext = () => {
    if (totalAmount > maxCashAmount) {
      Alert.alert(
        "Cash exceeds payment",
        `Total cash ₹${totalAmount} cannot exceed the payment amount ₹${maxCashAmount}.`,
      )
      return
    }
    const cashDetails = { noteCounts, coinCounts, totalAmount }
    router.push({
      pathname: "/ReturnedStocksScreen",
      params: { ...params, cashDetails: JSON.stringify(cashDetails) },
    })
  }

  const renderCard = (item: { label: string; value: number; color: string }, type: "note" | "coin") => (
    <View key={item.label} style={[styles.card, { backgroundColor: item.color }]}>
      <Text style={styles.label}>{item.label}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        maxLength={3}
        value={type === "note" ? (noteCounts[item.label] ?? "") : (coinCounts[item.label] ?? "")}
        placeholder="0"
        placeholderTextColor="#999"
        onChangeText={(val) => onChangeCount(type, item.label, val)}
      />
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Enter Cash Details</Text>
            <View style={styles.titleUnderline} />
          </View>
          <View style={styles.sectionHeader}>
            <Image source={require("../assets/images/Notes.png")} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Notes</Text>
          </View>
          {notes.map((note) => renderCard(note, "note"))}
          <View style={styles.sectionHeader}>
            <Image source={require("../assets/images/Coins.png")} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Coins</Text>
          </View>
          {coins.map((coin) => renderCard(coin, "coin"))}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Entered</Text>
            <Text style={styles.totalAmount}>{`₹${totalAmount}`}</Text>
            <Text style={styles.totalAdvice}>{`Allowed: ₹${maxCashAmount}`}</Text>
          </View>
          <TouchableOpacity style={styles.nextButton} onPress={onNext} activeOpacity={0.85}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 20 },
  titleContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1A365D",
    textAlign: "center",
    letterSpacing: -0.8,
    textShadowColor: "rgba(30, 41, 59, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: "#1e40af",
    borderRadius: 2,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 8,
    width: 24, // Added explicit width for PNG images
    height: 24, // Added explicit height for PNG images
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#334155",
    letterSpacing: -0.3,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 14,
    backgroundColor: "#1E90FF",
    shadowColor: "#0000FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  label: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: -0.2,
  },
  input: {
    width: 80,
    height: 48,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    backgroundColor: "#f8fafc",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  totalContainer: {
    marginTop: 32,
    padding: 24,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: "#475569",
    letterSpacing: -0.1,
  },
  totalAmount: {
    fontSize: 38,
    fontWeight: "900",
    color: "#1e40af",
    marginTop: 6,
    letterSpacing: -1,
  },
  totalAdvice: {
    marginTop: 8,
    fontWeight: "600",
    fontSize: 14,
    color: "#64748b",
    letterSpacing: -0.1,
  },
  nextButton: {
    marginTop: 40,
    borderRadius: 16,
    paddingVertical: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1e40af",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
})
