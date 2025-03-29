import { useContext, useState, useEffect } from "react";
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext"; // Assuming this exists to manage user state
import {
  Text,
  View,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function Slogin() {
  const navigation = useNavigation();
  const { url } = useContext(urlContext);
  const { setCuser } = useContext(userContext); // Added to set the logged-in user
  const [user, setUser] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "", general: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Fade-in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Input change handler with validation
  const onChange = (name, value) => {
    setUser({ ...user, [name]: value });
    setErrors({ ...errors, general: "" }); // Clear general error on input change
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setErrors({
        ...errors,
        email: emailRegex.test(value) || value === "" ? "" : "Invalid email format",
      });
    } else if (name === "password") {
      setErrors({
        ...errors,
        password: value.length >= 6 || value === "" ? "" : "Minimum 6 characters",
      });
    }
  };

  // Login handler
  const handlePress = async () => {
    if (!user.email || !user.password) {
      setErrors({ ...errors, general: "Please enter both email and password." });
      return;
    }
    if (errors.email || errors.password) {
      setErrors({ ...errors, general: "Please correct the errors before proceeding." });
      return;
    }

    setLoading(true);
    setErrors({ ...errors, general: "" }); // Clear any previous general errors

    try {
      console.log(`Attempting login with URL: ${url}/slogin`);
      const res = await axios.post(
        `${url}/slogin`,
        user,
        {
          timeout: 5000,
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log("Login response:", res.data);

      if (res.data.message === "Login successful") {
        setCuser(user.email); // Set the authenticated user in context
        navigation.navigate("sdash");
      } else {
        setErrors({ ...errors, general: res.data.message || "Unexpected response from server." });
      }
    } catch (error) {
      console.error("Login error:", {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        response: error.response?.data || "No response",
      });

      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.response) {
        // Server responded with an error status
        if (error.response.status === 401) {
          errorMessage = "Incorrect email or password.";
        } else if (error.response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else {
          errorMessage = error.response.data.message || "Login failed.";
        }
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Connection timed out. Check your network.";
      } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        errorMessage = "Server unreachable. Ensure it’s running.";
      }

      setErrors({ ...errors, general: errorMessage });
      Alert.alert("Login Failed", errorMessage, [
        { text: "Retry", onPress: () => handlePress() },
        { text: "OK" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.container}>
      <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Sign-In</Text>
          <Text style={styles.subtitle}>Secure access for super admins</Text>
        </View>

        <View style={styles.inputContainer}>
          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                value={user.email}
                onChangeText={(value) => onChange("email", value)}
                placeholder="Email Address"
                style={[styles.input, errors.email ? styles.inputError : null]}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94A3B8"
                editable={!loading}
              />
            </View>
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                value={user.password}
                onChangeText={(value) => onChange("password", value)}
                placeholder="Password"
                style={[styles.input, errors.password ? styles.inputError : null]}
                secureTextEntry={!showPassword}
                placeholderTextColor="#94A3B8"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          {/* General Error Message */}
          {errors.general ? (
            <Text style={styles.generalErrorText}>{errors.general}</Text>
          ) : null}

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => Alert.alert("Info", "Password reset feature coming soon!")}
            disabled={loading}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handlePress}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ["#6B7280", "#6B7280"] : ["#10B981", "#22C55E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate("userregister")}
            disabled={loading}
          >
            <Text style={styles.registerText}>Not an admin? Create a user account</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    padding: 28,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
    fontFamily: "System",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "400",
    fontFamily: "System",
  },
  inputContainer: {
    width: "100%",
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#1F2937",
    fontFamily: "System",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  eyeIcon: {
    padding: 10,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "400",
    fontFamily: "System",
  },
  generalErrorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
    fontFamily: "System",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
    fontFamily: "System",
  },
  loginButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
    fontFamily: "System",
  },
  registerText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    textDecorationLine: "underline",
    fontFamily: "System",
  },
});