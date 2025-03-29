import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // Added for gradient background
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";
import { Ionicons } from "@expo/vector-icons";

export default function ViewUserRequests() {
  const { url } = useContext(urlContext);
  const { cuser } = useContext(userContext);

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [canceling, setCanceling] = useState({});

  // Fetch join requests
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${url}/getuserrequests/${cuser}`, { timeout: 5000 });
      console.log("Response from backend:", res.data);
      const requests = res.data.requests_with_groupnames || [];
      setData(requests);
      setFilteredData(requests);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching user requests:", {
        message: err.message,
        code: err.code,
        response: err.response?.data,
      });
      let errorMessage = "Failed to fetch join requests.";
      if (err.code === "ECONNABORTED") errorMessage = "Request timed out. Check your connection.";
      else if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") errorMessage = "Server unreachable.";
      else if (err.response) errorMessage = err.response.data.message || "Server error.";
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cuser]);

  // Filter requests by group name
  const filterRequests = (query) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredData(data);
    } else {
      const filtered = data.filter((request) =>
        request.gname.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredData(filtered);
    }
  };

  // Cancel a join request
  const handleCancel = async (requestId) => {
    setCanceling((prev) => ({ ...prev, [requestId]: true }));
    try {
      const res = await axios.post(`${url}/cancelrequest`, { user: cuser, requestId });
      console.log("Cancel response:", res.data);
      setData((prev) => prev.filter((req) => req._id !== requestId));
      setFilteredData((prev) => prev.filter((req) => req._id !== requestId));
      alert("Request canceled successfully.");
    } catch (err) {
      console.error("Error canceling request:", err);
      const errorMsg = err.response?.data?.message || "Failed to cancel request.";
      alert(errorMsg);
    } finally {
      setCanceling((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  // Render request item
  const renderRequestItem = ({ item }) => {
    const statusColor = {
      accepted: "#10B981", // Green
      pending: "#F59E0B", // Orange
      rejected: "#EF4444", // Red
    }[item.status.toLowerCase()] || "#6B7280"; // Gray for unknown

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestInfo}>
          <Text style={styles.groupName}>{item.gname}</Text>
          <Text style={[styles.statusText, { color: statusColor }]}>
            Status: {item.status}
          </Text>
        </View>
        {item.status.toLowerCase() === "pending" && (
          <TouchableOpacity
            style={[styles.cancelButton, canceling[item._id] && styles.cancelButtonDisabled]}
            onPress={() => handleCancel(item._id)}
            disabled={canceling[item._id]}
          >
            <LinearGradient
              colors={canceling[item._id] ? ["#FCA5A5", "#FCA5A5"] : ["#EF4444", "#F87171"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {canceling[item._id] ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <LinearGradient colors={["#F3F4F6", "#E5E7EB"]} style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by group name..."
          value={searchQuery}
          onChangeText={filterRequests}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="warning-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <LinearGradient
              colors={["#1E40AF", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={48} color="#6B7280" />
          <Text style={styles.emptyText}>No join requests found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item._id || item.requestId || Math.random().toString()}
          renderItem={renderRequestItem}
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  requestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  requestInfo: {
    flex: 1,
    marginRight: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  cancelButton: {
    borderRadius: 8,
  },
  cancelButtonDisabled: {
    opacity: 0.8,
  },
  buttonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  retryButton: {
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
    fontWeight: "500",
  },
});