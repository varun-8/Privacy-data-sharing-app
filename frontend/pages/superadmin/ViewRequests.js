import { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
} from "react-native";
import axios from "axios";
import { urlContext } from "../../urlContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function ViewRequests() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const { url } = useContext(urlContext);

  const fetchData = async () => {
    setLoading(true);
    const requestUrl = `${url}/getrequests`;
    try {
      const res = await axios.get(requestUrl, { timeout: 5000 });
      const requests = res.data.requests || res.data || [];
      const validRequests = requests.filter(
        (item) => item && item.gid && typeof item.gid === "string"
      );
      setData(validRequests);
      setFilteredData(validRequests);
    } catch (err) {
      setError("Network Error: Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredData(data);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = data.filter(
      (item) =>
        (item.name?.toLowerCase() || "").includes(lowerQuery) ||
        (item.description?.toLowerCase() || "").includes(lowerQuery) ||
        (item.user?.toLowerCase() || "").includes(lowerQuery) ||
        (item.status?.toLowerCase() || "").includes(lowerQuery)
    );
    setFilteredData(filtered);
  };

  const handleAllow = async (groupId, user) => {
    if (!groupId || typeof groupId !== "string") {
      Alert.alert("Error", "Invalid Group ID");
      return;
    }
    try {
      const requestUrl = `${url}/allowrequests/${groupId}/${user}`;
      const res = await axios.post(requestUrl, {}, { timeout: 5000 });
      Alert.alert("Success", res.data.message);
      fetchData();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to allow request.");
    }
  };

  const handleDeny = async (groupId, user) => {
    if (!groupId || typeof groupId !== "string") {
      Alert.alert("Error", "Invalid Group ID");
      return;
    }
    try {
      const requestUrl = `${url}/denyrequests/${groupId}/${user}`;
      const res = await axios.post(requestUrl, {}, { timeout: 5000 });
      Alert.alert("Denied", res.data.message);
      fetchData();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to deny request.");
    }
  };

  const toggleExpand = (gid) => {
    setExpandedId(expandedId === gid ? null : gid);
  };

  if (loading) {
    return (
      <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.center}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading Requests...</Text>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return styles.statusPending;
      case "approved":
        return styles.statusApproved;
      case "denied":
        return styles.statusDenied;
      default:
        return styles.statusDefault;
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity onPress={() => toggleExpand(item.gid)} style={styles.groupHeader}>
        <Text style={styles.groupName}>{item.name || "N/A"}</Text>
        <Text style={styles.expandIcon}>{expandedId === item.gid ? "−" : "+"}</Text>
      </TouchableOpacity>
      {expandedId === item.gid && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>Purpose: {item.description || "N/A"}</Text>
          <Text style={styles.detailText}>Admin: {item.user || "N/A"}</Text>
          <Text style={[styles.detailText, getStatusStyle(item.status)]}>
            Status: {item.status || "N/A"}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.allowButton]}
              onPress={() => handleAllow(item.gid, item.user)}
            >
              <LinearGradient
                colors={["#28A745", "#34C759"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Allow</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.denyButton]}
              onPress={() => handleDeny(item.gid, item.user)}
            >
              <LinearGradient
                colors={["#DC3545", "#FF6B6B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Deny</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Group Requests</Text>
        <TouchableOpacity onPress={fetchData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search requests..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={60} color="#64748B" />
          <Text style={styles.noDataText}>
            {searchQuery ? "No matching requests found." : "No requests found."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.gid}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    fontSize: 32, // Larger for emphasis
    fontWeight: "600",
    color: "#FFFFFF", // White on gradient
    letterSpacing: 0.5, // Slight spacing for elegance
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
    height: 50, // Taller for better touch
    fontSize: 16,
    color: "#1A3552",
  },
  itemContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16, // Softer corners
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6, // Deeper shadow
    overflow: "hidden",
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#2A5D8F",
  },
  groupName: {
    fontSize: 18,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  expandIcon: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  detailsContainer: {
    padding: 15,
  },
  detailText: {
    fontSize: 16,
    color: "#1A3552",
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    borderRadius: 8,
    overflow: "hidden",
  },
  allowButton: {},
  denyButton: {},
  buttonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  statusPending: { color: "#FFC107", fontWeight: "bold" },
  statusApproved: { color: "#28A745", fontWeight: "bold" },
  statusDenied: { color: "#DC3545", fontWeight: "bold" },
  statusDefault: { color: "#6C757D", fontWeight: "bold" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#FFFFFF", // White on gradient
    marginTop: 10,
  },
  errorText: {
    fontSize: 18, // Slightly larger for visibility
    color: "#FFFFFF", // White on gradient
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#F59E0B", // Vibrant retry button
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noDataText: {
    fontSize: 18,
    color: "#FFFFFF", // White on gradient
    textAlign: "center",
    marginTop: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
});