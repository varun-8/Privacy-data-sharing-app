import { useRoute } from "@react-navigation/native";
import axios from "axios";
import { useEffect, useState, useContext, useRef } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system"; // For local file storage
import { encode as base64Encode } from "base64-arraybuffer"; // Import base64 encoder

export default function SeeFiles() {
  const route = useRoute();
  const { gid } = route.params || {};

  const { url } = useContext(urlContext);
  const { cuser } = useContext(userContext);

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const flatListRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${url}/getfiles/${gid}`, { timeout: 10000 });
      const files = res.data.files || [];
      setData(files);
      setFilteredData(files);
    } catch (error) {
      console.error("Error fetching files:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to fetch files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [gid]);

  const handleEmailDownload = async (fid) => {
    try {
      const res = await axios.get(`${url}/download/${fid}/${cuser}`, { timeout: 15000 });
      if (res.status === 200) {
        Alert.alert("Success", "File has been sent to your email!");
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (error) {
      console.error("Download error:", error.response?.data || error.message);
      if (error.code === "ECONNABORTED") {
        Alert.alert(
          "Processing",
          "The request took longer than expected. Check your email for the file."
        );
      } else if (error.response) {
        Alert.alert("Error", error.response.data.error || "Failed to process download.");
      } else {
        Alert.alert("Error", "Network issue. Please check your connection and try again.");
      }
    }
  };

  const handleLocalDownload = async (fid, fileName) => {
    try {
      const response = await axios.get(`${url}/download-local/${fid}`, {
        responseType: "arraybuffer", // Handle binary data
        timeout: 15000,
      });

      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const base64Data = base64Encode(response.data); // Convert ArrayBuffer to Base64

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert("Success", `File stored locally at: ${fileUri}`);
    } catch (error) {
      console.error("Local download error:", error.response?.data || error.message);
      if (error.code === "ECONNABORTED") {
        Alert.alert("Error", "Download took too long. Please try again.");
      } else if (error.response) {
        Alert.alert("Error", error.response.data.error || "Failed to store file locally.");
      } else {
        Alert.alert("Error", "Network issue or file save failed. Please try again.");
      }
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredData(data);
    } else {
      const filtered = data.filter((item) =>
        item.file_name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredData(filtered);
    }
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const renderItem = ({ item }) => (
    <View style={styles.fileItem}>
      <View style={styles.fileContent}>
        <Text style={styles.fileName}>{item.file_name}</Text>
        <Text style={styles.fileInfo}>Uploaded by: {item.user_name}</Text>
        <Text style={styles.fileDate}>
          {new Date(item.upload_date).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        {/* Email Download Button */}
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => handleEmailDownload(item._id)}
        >
          <LinearGradient
            colors={["#4299E1", "#7F9CF5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.downloadGradient}
          >
            <Ionicons name="mail-outline" size={18} color="#FFF" />
            <Text style={styles.buttonText}>Email</Text>
          </LinearGradient>
        </TouchableOpacity>
        {/* Local Store Button */}
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => handleLocalDownload(item._id, item.file_name)}
        >
          <LinearGradient
            colors={["#48BB78", "#68D391"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.downloadGradient}
          >
            <Ionicons name="save-outline" size={18} color="#FFF" />
            <Text style={styles.buttonText}>Store</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#F7FAFC", "#EDF2F7"]} style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Files in Group</Text>
        <TouchableOpacity onPress={fetchData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color="#4299E1" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#718096" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search files..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#A0AEC0"
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4299E1" />
          <Text style={styles.loadingText}>Loading Files...</Text>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={50} color="#A0AEC0" />
          <Text style={styles.emptyText}>
            {searchQuery ? "No files match your search." : "No files available yet."}
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={filteredData}
            keyExtractor={(item) => item._id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.fileList}
            showsVerticalScrollIndicator={false}
          />
          <TouchableOpacity style={styles.scrollToTopButton} onPress={scrollToTop}>
            <Ionicons name="chevron-up" size={20} color="#FFF" />
          </TouchableOpacity>
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  header: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2D3748",
    fontFamily: "System",
  },
  refreshButton: {
    padding: 8,
    backgroundColor: "#EDF2F7",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#2D3748",
    paddingVertical: 10,
    fontFamily: "System",
  },
  fileList: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  fileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fileContent: {
    flex: 1,
    marginRight: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 4,
    fontFamily: "System",
  },
  fileInfo: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 2,
    fontFamily: "System",
  },
  fileDate: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "System",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  downloadButton: {
    borderRadius: 20,
    marginLeft: 8,
  },
  downloadGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
    fontFamily: "System",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#4299E1",
    fontWeight: "500",
    fontFamily: "System",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    marginTop: 12,
    fontFamily: "System",
  },
  scrollToTopButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#4299E1",
    padding: 10,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});