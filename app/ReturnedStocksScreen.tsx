"use client"

import { useLocalSearchParams, useRouter } from "expo-router"
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native"

type ProductItem = {
  name: string
  returned: number
}

export default function ReturnedStocksScreen() {
  const params = useLocalSearchParams()
  const router = useRouter()

  // Parse sent and delivered from params (sent: product -> qty sent, delivered: product -> qty delivered)
  const sent: Record<string, number> = params.sent ? JSON.parse(params.sent as string) : {}
  const delivered: Record<string, number> = params.delivered ? JSON.parse(params.delivered as string) : {}

  // Compose the list of returned products as sent - delivered
  const products: ProductItem[] = Object.entries(sent)
    .filter(([_, qty]) => Number(qty) > 0)
    .map(([name, sentQty]) => {
      const deliveredQty = delivered && delivered[name] ? Number(delivered[name]) : 0
      return {
        name,
        returned: Number(sentQty) - deliveredQty,
      }
    })

  // Total returned calculation
  const totalReturned = products.reduce((sum, p) => sum + p.returned, 0)

  // To pass to summary screen
  const handleSummary = () => {
    const returnedObj = Object.fromEntries(products.map((p) => [p.name, String(p.returned)]))
    router.push({
      pathname: "/DailySummaryScreen",
      params: {
        sent: params.sent,
        delivered: params.delivered,
        payments: params.payments,
        returned: JSON.stringify(returnedObj),
      },
    })
  }

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Cheerful message */}
      <View style={styles.cheerBox}>
        <Text style={styles.cheerIcon}>✅</Text>
        <Text style={styles.cheerText}>Deliveries completed! Great job 👍</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Returned Stock</Text>
        <View style={styles.divider} />
        <FlatList
          data={products}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <View style={styles.productBox}>
              <Text style={styles.productLabel} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.inputReadOnly}>
                <Text style={styles.returnedText}>{item.returned}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No products found.</Text>}
          contentContainerStyle={{ paddingTop: 12 }}
          keyboardShouldPersistTaps="handled"
        />
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>
            Total: {totalReturned} packet{totalReturned !== 1 ? "s" : ""} returned
          </Text>
        </View>

        <TouchableOpacity style={styles.floatingButton} onPress={handleSummary} activeOpacity={0.8}>
          <Text style={styles.floatingButtonText}>📊 Go to Summary</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F5F6F9",
    paddingTop: 60, // Add top padding for proper spacing
    paddingHorizontal: 20,
  },
  cheerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBE8",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 20,
    alignSelf: "center",
    shadowColor: "#FFD700",
    shadowOpacity: 0.09,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cheerIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  cheerText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#BA7E25",
  },
  card: {
    minWidth: 320,
    width: 360,
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
    alignItems: "stretch",
    alignSelf: "center",
    flex: 1, // Allow the card to take available space
    maxHeight: "80%", // Prevent it from taking too much space
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#232B3A",
    paddingLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#E4E7EB",
    marginVertical: 16,
  },
  productBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#E6E8EF",
    marginBottom: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    justifyContent: "space-between",
    shadowColor: "#90A4AE",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  productLabel: {
    flex: 1,
    fontSize: 18,
    color: "#1C2833",
    fontWeight: "600",
  },
  inputReadOnly: {
    minWidth: 56,
    height: 42,
    backgroundColor: "#FFD699", // orangish background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0B56B", // deeper orange border
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
    marginRight: 4,
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  returnedText: {
    fontSize: 20,
    color: "#E07B00", // deep orange text
    fontWeight: "700",
  },
  totalContainer: {
    marginTop: 10,
    marginBottom: 18,
    paddingHorizontal: 8,
    alignItems: "flex-end",
  },
  totalText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#B45B00",
  },
  empty: {
    color: "#8B9BB7",
    textAlign: "center",
    marginVertical: 28,
    fontSize: 16,
  },
  floatingButton: {
    backgroundColor: "#297BF6",
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center",
    alignSelf: "center",
    elevation: 8,
    shadowColor: "#4D90FE",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  floatingButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
})
