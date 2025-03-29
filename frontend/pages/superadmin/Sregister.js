import { useState, useContext } from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import axios from "axios";
import { urlContext } from "../../urlContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

export default function Sregister() {
  const navigation = useNavigation();
  const { url } = useContext(urlContext);
  const [user, setUser] = useState({ name: "", password: "", confirmPassword: "", email: "" });
  const [errors, setErrors] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  // Input change handler with validation
  const handleInputChange = (field, value) => {
    setUser({ ...user, [field]: value });
    setSubmissionError(""); // Clear submission error on input change

    if (field === "name") {
      setErrors({
        ...errors,
        name: value.length >= 2 || value === "" ? "" : "Name must be at least 2 characters",
      });
    } else if (field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setErrors({
        ...errors,
        email: emailRegex.test(value) || value === "" ? "" : "Invalid email format",
      });
    } else if (field === "password") {
      setErrors({
        ...errors,
        password: value.length >= 6 || value === "" ? "" : "Password must be at least 6 characters",
        confirmPassword:
          value === user.confirmPassword || user.confirmPassword === ""
            ? ""
            : "Passwords do not match",
      });
    } else if (field === "confirmPassword") {
      setErrors({
        ...errors,
        confirmPassword: value === user.password || value === "" ? "" : "Passwords do not match",
      });
    }
  };

  // Retry with exponential backoff
  const axiosWithRetry = async (url, data, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await axios.post(url, data, {
          timeout: 5000,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        if (i === retries - 1) throw error; // Last retry failed
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
      }
    }
  };

  // Submit handler with enhanced error handling
  const handleSubmit = async () => {
    if (!user.name || !user.email || !user.password || !user.confirmPassword) {
      setSubmissionError("All fields are required!");
      return;
    }
    if (Object.values(errors).some((error) => error)) {
      setSubmissionError("Please fix the errors in the form.");
      return;
    }

    setLoading(true);
    setSubmissionError("");
    try {
      console.log(`Registering with URL: ${url}/superregister`);
      const res = await axiosWithRetry(`${url}/superregister`, {
        name: user.name,
        email: user.email,
        password: user.password,
      });
      console.log("Register response:", res.data);
      Alert.alert("Success", res.data.message, [
        { text: "OK", onPress: () => navigation.navigate("slogin") },
      ]);
      setUser({ name: "", password: "", confirmPassword: "", email: "" });
    } catch (error) {
      console.error("Register error:", {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        response: error.response?.data || "No response",
      });
      let errorMessage = "Registration failed. Please try again.";
      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Check your internet connection.";
      } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        errorMessage = "Server not found. Ensure the server is running.";
      } else if (error.response) {
        errorMessage = error.response.data.message || "Server error occurred.";
      }
      setSubmissionError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Clear form handler
  const handleClear = () => {
    setUser({ name: "", password: "", confirmPassword: "", email: "" });
    setErrors({ name: "", email: "", password: "", confirmPassword: "" });
    setSubmissionError("");
  };

  return (
    <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Super Admin Registration</Text>
        <View style={styles.formContainer}>
          {/* Name Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                value={user.name}
                onChangeText={(text) => handleInputChange("name", text)}
                placeholder="Enter Name"
                style={[styles.input, errors.name ? styles.inputError : null]}
                placeholderTextColor="#94A3B8"
              />
            </View>
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                value={user.email}
                onChangeText={(text) => handleInputChange("email", text)}
                placeholder="Enter Email"
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, errors.email ? styles.inputError : null]}
                placeholderTextColor="#94A3B8"
              />
            </View>
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                value={user.password}
                onChangeText={(text) => handleInputChange("password", text)}
                placeholder="Enter Password"
                secureTextEntry={!showPassword}
                style={[styles.input, errors.password ? styles.inputError : null]}
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                value={user.confirmPassword}
                onChangeText={(text) => handleInputChange("confirmPassword", text)}
                placeholder="Confirm Password"
                secureTextEntry={!showConfirmPassword}
                style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}
          </View>

          {/* Submission Error */}
          {submissionError ? <Text style={styles.submissionError}>{submissionError}</Text> : null}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ["#93C5FD", "#93C5FD"] : ["#1E40AF", "#3B82F6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <LinearGradient
                colors={["#EF4444", "#F87171"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Clear</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Back to Login Link */}
          <TouchableOpacity onPress={() => navigation.navigate("slogin")}>
            <Text style={styles.loginText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Registering...</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 40,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    padding: 30,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  input: {
    flex: 1,
    height: 52,
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 16,
    color: "#1F2A44",
    backgroundColor: "#F9FAFB",
  },
  inputError: {
    borderColor: "#EF4444",
    borderWidth: 2,
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "400",
  },
  submissionError: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  registerButton: {
    borderRadius: 12,
    overflow: "hidden",
    flex: 1,
    marginRight: 10,
  },
  clearButton: {
    borderRadius: 12,
    overflow: "hidden",
    flex: 1,
    marginLeft: 10,
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
  },
  loginText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 10,
    fontWeight: "500",
  },
});