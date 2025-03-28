import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from "@expo-google-fonts/roboto";

export default function ViewJoinRequests() {
  const { url } = useContext(urlContext);
  const { cuser } = useContext(userContext);

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Load Roboto fonts
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  // Fetch data from the backend API
  const fetchData = async () => {
    try {
      const res = await axios.get(`${url}/getjoinrequests/${cuser}`);
      const requests = res.data.requests_with_groupnames || [];
      // Fetch usernames for each requestor
      const updatedRequests = await Promise.all(
        requests.map(async (request) => {
          const userRes = await axios.get(`${url}/getusername/${request.requestor}`);
          return { ...request, username: userRes.data.name || request.requestor };
        })
      );
      setData(updatedRequests);
      setFilteredData(updatedRequests);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error("Error fetching join requests:", err);
      setError("Error fetching join requests.");
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (fontsLoaded) {
      fetchData();
    }
  }, [cuser, fontsLoaded]);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const filtered = data.filter(
        (item) =>
          item.username.toLowerCase().includes(query.toLowerCase()) ||
          item.gname.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  };

  // Handle allow action
  const handleAllow = async (gid) => {
    try {
      const res = await axios.get(`${url}/allowjoin/${gid}`);
      Alert.alert("Success", res.data.message);
      fetchData(); // Refresh data after allowing
    } catch (err) {
      Alert.alert("Error", "Failed to process request.");
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Requests</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username or group..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {filteredData.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.noRequestsText}>
            {searchQuery ? "No matching requests found." : "No join requests available."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
              <View style={styles.cardContent}>
                <Text style={styles.requestorText}>{item.username}</Text>
                <Text style={styles.groupText}>{item.gname}</Text>
                <Text style={styles.statusText}>Status: {item.status}</Text>
              </View>
              <TouchableOpacity
                style={styles.allowButton}
                onPress={() => handleAllow(item._id)}
              >
                <Text style={styles.allowButtonText}>Allow</Text>
              </TouchableOpacity>
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3B82F6"]} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2A44",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Roboto_700Bold",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: "#1F2A44",
    fontFamily: "Roboto_400Regular",
  },
  requestCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardContent: {
    flex: 1,
  },
  requestorText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#3B82F6",
    marginBottom: 4,
    fontFamily: "Roboto_500Medium",
  },
  groupText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2A44",
    marginBottom: 4,
    fontFamily: "Roboto_700Bold",
  },
  statusText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Roboto_400Regular",
  },
  allowButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 2,
  },
  allowButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Roboto_500Medium",
  },
  noRequestsText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    fontFamily: "Roboto_400Regular",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6B7280",
    fontFamily: "Roboto_400Regular",
  },
  errorText: {
    fontSize: 18,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 15,
    fontFamily: "Roboto_500Medium",
  },
  retryButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    elevation: 2,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Roboto_500Medium",
  },
});