import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";

export default function Settings() {
  const navigation = useNavigation();
  const { url } = useContext(urlContext);
  const { cuser } = useContext(userContext);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [apiKey, setApiKey] = useState("");
  const [retentionDays, setRetentionDays] = useState("");
  const [loading, setLoading] = useState(false);

  // Change Password
  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert("Error", "All fields are required.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Error", "New password and confirmation do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${url}/change-superadmin-password`, {
        email: cuser,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      Alert.alert("Success", res.data.message);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  // Delete All Files
  const handleDeleteAllFiles = () => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete all files? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const res = await axios.delete(`${url}/delete-all-files`, {
                data: { email: cuser }, // Pass email for authorization
              });
              Alert.alert("Success", res.data.message);
            } catch (err) {
              Alert.alert("Error", err.response?.data?.message || "Failed to delete all files.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Generate API Key
  const handleGenerateApiKey = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${url}/generate-api-key`, { email: cuser });
      setApiKey(res.data.apiKey);
      Alert.alert("Success", "New API key generated: " + res.data.apiKey);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to generate API key.");
    } finally {
      setLoading(false);
    }
  };

  // Set Data Retention Policy
  const handleSetRetentionPolicy = async () => {
    if (!retentionDays || isNaN(retentionDays) || retentionDays <= 0) {
      Alert.alert("Error", "Please enter a valid number of days.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${url}/set-retention-policy`, {
        email: cuser,
        days: parseInt(retentionDays),
      });
      Alert.alert("Success", res.data.message);
      setRetentionDays("");
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to set retention policy.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Change Password Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Current Password"
          secureTextEntry
          value={passwordData.currentPassword}
          onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          secureTextEntry
          value={passwordData.newPassword}
          onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          secureTextEntry
          value={passwordData.confirmPassword}
          onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handlePasswordChange}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Changing..." : "Change Password"}</Text>
        </TouchableOpacity>
      </View>

      {/* Delete All Files Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delete All Files</Text>
        <Text style={styles.sectionDescription}>
          Permanently delete all files stored in the database. This action cannot be undone.
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.dangerButton, loading && styles.buttonDisabled]}
          onPress={handleDeleteAllFiles}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Deleting..." : "Delete All Files"}</Text>
        </TouchableOpacity>
      </View>

      {/* Manage API Keys Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage API Keys</Text>
        <Text style={styles.sectionDescription}>
          Generate an API key for secure integrations with external services.
        </Text>
        {apiKey ? (
          <Text style={styles.apiKeyText}>Current API Key: {apiKey}</Text>
        ) : null}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleGenerateApiKey}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Generating..." : "Generate API Key"}</Text>
        </TouchableOpacity>
      </View>

      {/* Data Retention Policy Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Retention Policy</Text>
        <Text style={styles.sectionDescription}>
          Set the number of days after which files and data are automatically deleted.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Retention Days (e.g., 30)"
          keyboardType="numeric"
          value={retentionDays}
          onChangeText={setRetentionDays}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSetRetentionPolicy}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Saving..." : "Set Retention Policy"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F7F9FC",
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    color: "#1A3552",
  },
  backButton: {
    padding: 5,
  },
  backText: {
    fontSize: 16,
    color: "#2A5D8F",
    fontWeight: "500",
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#1A3552",
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6C757D",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    height: 45,
    borderColor: "#D1D9E0",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 16,
    color: "#1A3552",
    backgroundColor: "#F9FAFB",
  },
  button: {
    backgroundColor: "#2A5D8F",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  dangerButton: {
    backgroundColor: "#DC3545",
  },
  buttonDisabled: {
    backgroundColor: "#A3BFFA",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  apiKeyText: {
    fontSize: 14,
    color: "#1A3552",
    marginBottom: 15,
    fontFamily: "monospace",
  },
});