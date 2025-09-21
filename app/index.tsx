"use client"

// app/index.tsx
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { useState } from "react"

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

export default function Index() {
  const [workerId, setWorkerId] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false) // 👁️ toggle
  const router = useRouter()

  const handleLogin = async () => {
    if (!workerId.trim()) {
      Alert.alert("Error", "Please enter your Worker ID")
      return
    }

    if (password.length !== 4) {
      Alert.alert("Error", "PIN must be exactly 4 digits")
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // Pass workerId as query parameter to MorningStockScreen
      router.push(`/MorningStockScreen?workerId=${encodeURIComponent(workerId.trim())}`)
    } catch (error) {
      Alert.alert("Login Failed", "Please check your credentials and try again")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <LinearGradient colors={["#F8F9FA", "#F1F5F9", "#E2E8F0"]} style={styles.gradientBackground}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })}
        >
          <View style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.heading}>दूध वितरण</Text>
              <Text style={styles.subtitle}>Worker Login Portal</Text>

              {/* Worker ID Input with Icon */}
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#64748B" style={styles.icon} />
                <TextInput
                  placeholder="Worker ID"
                  placeholderTextColor="#999999"
                  value={workerId}
                  onChangeText={(text) => setWorkerId(text.replace(/[^a-zA-Z0-9]/g, ""))}
                  style={styles.inputWithIcon}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              {/* Password Input with Icon + Eye Toggle */}
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.icon} />
                <TextInput
                  placeholder="4-digit PIN"
                  placeholderTextColor="#999999"
                  value={password}
                  onChangeText={(text) => {
                    const next = text.replace(/\D/g, "").slice(0, 4)
                    setPassword(next)
                  }}
                  style={styles.inputWithIcon}
                  secureTextEntry={!showPassword} // 👁️ toggle
                  editable={!isLoading}
                  maxLength={4}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  contextMenuHidden
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>LOGIN</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  inputWithIcon: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#1E293B",
  },
  button: {
    height: 50,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: "#93C5FD",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
})

