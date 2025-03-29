import { useState, useEffect, useContext } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { urlContext } from "../../urlContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function ManageUsers() {
  const { url } = useContext(urlContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [newUser, setNewUser] = useState({ email: "", role: "user" });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailError, setEmailError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${url}/users`, { timeout: 5000 });
      const userList = res.data.users || [];
      setUsers(userList);
      setFilteredUsers(userList);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.role) {
      Alert.alert("Missing Fields", "Please enter both email and role.");
      return;
    }
    if (!validateEmail(newUser.email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    try {
      setActionLoading(true);
      const res = await axios.post(`${url}/add-user`, newUser, {
        timeout: 5000,
        headers: { "Content-Type": "application/json" },
      });
      Alert.alert("Success", res.data.message);
      setNewUser({ email: "", role: "user" });
      setEmailError("");
      fetchUsers();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to add user.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveUser = (userId, userName) => {
    Alert.alert(
      "Confirm Removal",
      `Are you sure you want to remove ${userName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              const res = await axios.delete(`${url}/remove-user/${userId}`, { timeout: 5000 });
              Alert.alert("Success", res.data.message);
              fetchUsers();
            } catch (err) {
              Alert.alert("Error", err.response?.data?.message || "Failed to remove user.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          user.role.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const toggleRole = () => {
    setNewUser({
      ...newUser,
      role: newUser.role === "user" ? "admin" : "user",
    });
  };

  if (loading) {
    return (
      <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.center}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading Users...</Text>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.center}>
        {/* Wrap error string in Text component */}
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Users</Text>
        <TouchableOpacity onPress={fetchUsers} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or role..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="Email Address"
            value={newUser.email}
            onChangeText={(text) => {
              setNewUser({ ...newUser, email: text });
              setEmailError(validateEmail(text) || text === "" ? "" : "Invalid email format");
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#94A3B8"
          />
        </View>
        {emailError ? <Text style={styles.errorMessage}>{emailError}</Text> : null}
        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>Role:</Text>
          <TouchableOpacity style={styles.roleButton} onPress={toggleRole}>
            <Text style={styles.roleText}>{newUser.role}</Text>
            <Ionicons name="chevron-down-outline" size={20} color="#1F2937" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.addButton, actionLoading && styles.disabledButton]}
          onPress={handleAddUser}
          disabled={actionLoading}
        >
          <LinearGradient
            colors={["#10B981", "#22C55E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="person-add-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Add User</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userRole}>{item.role}</Text>
            </View>
            <TouchableOpacity
              style={[styles.removeButton, actionLoading && styles.disabledButton]}
              onPress={() => handleRemoveUser(item.id, item.name)}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.removeButtonText}>Remove</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#64748B" />
            <Text style={styles.emptyText}>
              {searchQuery ? "No users match your search." : "No users found. Add one to get started!"}
            </Text>
          </View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "System",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#1F2937",
    fontFamily: "System",
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    marginBottom: 16,
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
  errorMessage: {
    color: "#EF4444",
    fontSize: 12,
    marginBottom: 16,
    fontFamily: "System",
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "600",
    fontFamily: "System",
  },
  roleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
  },
  roleText: {
    fontSize: 16,
    color: "#1F2937",
    marginRight: 8,
    fontFamily: "System",
  },
  addButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "System",
  },
  userCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    fontFamily: "System",
  },
  userRole: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    fontFamily: "System",
  },
  removeButton: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    alignItems: "center",
  },
  removeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    fontFamily: "System",
  },
  disabledButton: {
    opacity: 0.6,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    fontFamily: "System",
  },
  errorText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "System",
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#F59E0B",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "System",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#FFFFFF",
    marginTop: 12,
    textAlign: "center",
    fontFamily: "System",
  },
  listContent: {
    paddingBottom: 20,
  },
});