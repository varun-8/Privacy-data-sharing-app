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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";
import { Ionicons } from "@expo/vector-icons";

export default function GroupChat() {
  const route = useRoute();
  const { gid, name } = route.params || {};

  const { url } = useContext(urlContext);
  const { cuser } = useContext(userContext);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [expandedFile, setExpandedFile] = useState(null);
  const flatListRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${url}/getfiles/${gid}`, { timeout: 10000 });
      console.log("Fetched data:", res.data);
      setData(res.data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to fetch group data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [gid]);

  const handleDownload = async (fid) => {
    try {
      // Increase timeout to handle slow email sending
      const res = await axios.get(`${url}/download/${fid}/${cuser}`, { timeout: 15000 });
      if (res.status === 200) {
        Alert.alert("Success", "File has been sent to your email!");
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (error) {
      console.error("Download error:", error.response?.data || error.message);
      // Handle specific cases
      if (error.code === "ECONNABORTED") {
        // Timeout case: email might still be sent
        Alert.alert(
          "Processing",
          "The request took longer than expected. Check your email for the file."
        );
      } else if (error.response) {
        // Server returned an error response
        Alert.alert("Error", error.response.data.error || "Failed to process download.");
      } else {
        // Network or other unexpected errors
        Alert.alert("Error", "Network issue. Please check your connection and try again.");
      }
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
      if (!result.canceled && result.assets?.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert("Error", "Failed to pick a file.");
    }
  };

  const cancelFile = () => setFile(null);

  const uploadFile = async () => {
    if (!message.trim() && !file) {
      Alert.alert("Error", "Please add a message or pick a file.");
      return;
    }

    setSending(true);
    const formData = new FormData();
    if (file) {
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/octet-stream",
      });
    }
    formData.append("group_id", gid);
    formData.append("user", cuser);
    if (message.trim()) formData.append("message", message);

    try {
      console.log(`Uploading to: ${url}/fileupload`);
      const res = await axios.post(`${url}/fileupload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 10000,
      });
      console.log("Upload response:", res.data);
      setMessage("");
      setFile(null);
      fetchData();
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to upload file/message.");
    } finally {
      setSending(false);
    }
  };

  const toggleFileExpansion = (id) => {
    setExpandedFile(expandedFile === id ? null : id);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const renderItem = ({ item, index }) => {
    const isExpanded = expandedFile === item._id;
    const isFirstMessageOfDay =
      index === data.length - 1 ||
      new Date(data[index + 1].upload_date).toDateString() !==
        new Date(item.upload_date).toDateString();

    return (
      <>
        {isFirstMessageOfDay && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>
              {new Date(item.upload_date).toLocaleDateString()}
            </Text>
          </View>
        )}
        <View style={styles.messageContainer}>
          <View style={styles.messageRow}>
            <Text style={styles.userName}>{item.user_name}</Text>
            <Text style={styles.timestamp}>
              {new Date(item.upload_date).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          {item.message && <Text style={styles.messageText}>{item.message}</Text>}
          {item.file_name && (
            <TouchableOpacity
              style={styles.fileContainer}
              onPress={() => toggleFileExpansion(item._id)}
            >
              <Ionicons name="document-outline" size={18} color="#4299E1" />
              <Text style={styles.fileName} numberOfLines={isExpanded ? 0 : 1}>
                {item.file_name}
              </Text>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color="#4299E1"
              />
            </TouchableOpacity>
          )}
          {isExpanded && item.file_name && (
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => handleDownload(item._id)}
            >
              <LinearGradient
                colors={["#4299E1", "#7F9CF5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.downloadGradient}
              >
                <Ionicons name="download-outline" size={16} color="#FFF" />
                <Text style={styles.downloadText}>Download</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </>
    );
  };

  return (
    <LinearGradient colors={["#F7FAFC", "#EDF2F7"]} style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>{name || `Group ${gid || "Unknown"}`}</Text>
        <TouchableOpacity onPress={fetchData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color="#4299E1" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4299E1" />
          <Text style={styles.loadingText}>Loading Messages...</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbox-outline" size={50} color="#A0AEC0" />
          <Text style={styles.emptyText}>No messages yet</Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={data}
            keyExtractor={(item) => item._id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
            inverted
          />
          <TouchableOpacity style={styles.scrollToBottomButton} onPress={scrollToBottom}>
            <Ionicons name="chevron-down" size={20} color="#FFF" />
          </TouchableOpacity>
        </>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        style={styles.inputContainer}
      >
        {file && (
          <View style={styles.filePreview}>
            <Ionicons name="document-outline" size={18} color="#4299E1" />
            <Text style={styles.filePreviewText}>{file.name}</Text>
            <TouchableOpacity onPress={cancelFile}>
              <Ionicons name="close" size={18} color="#E53E3E" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={pickFile}
            disabled={sending}
          >
            <Ionicons name="attach" size={22} color="#4299E1" />
          </TouchableOpacity>
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message..."
            value={message}
            onChangeText={setMessage}
            multiline
            editable={!sending}
            placeholderTextColor="#A0AEC0"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={uploadFile}
            disabled={sending}
          >
            <LinearGradient
              colors={sending ? ["#A0AEC0", "#A0AEC0"] : ["#4299E1", "#7F9CF5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sendGradient}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="send" size={18} color="#FFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  chatList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  messageContainer: {
    padding: 12,
    backgroundColor: "#F7FAFC",
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  messageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4299E1",
    fontFamily: "System",
  },
  messageText: {
    fontSize: 16,
    color: "#2D3748",
    lineHeight: 22,
    fontFamily: "System",
  },
  fileContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#EDF2F7",
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  fileName: {
    fontSize: 14,
    color: "#2D3748",
    flex: 1,
    marginHorizontal: 8,
    fontFamily: "System",
  },
  downloadButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  downloadGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  downloadText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    fontFamily: "System",
  },
  timestamp: {
    fontSize: 12,
    color: "#718096",
    fontFamily: "System",
  },
  dateSeparator: {
    alignItems: "center",
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 12,
    color: "#718096",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
    marginTop: 12,
    fontFamily: "System",
  },
  scrollToBottomButton: {
    position: "absolute",
    bottom: 80,
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
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#EDF2F7",
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filePreviewText: {
    fontSize: 14,
    color: "#2D3748",
    flex: 1,
    marginHorizontal: 8,
    fontFamily: "System",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDF2F7",
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  attachButton: {
    padding: 8,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: "#2D3748",
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxHeight: 100,
    fontFamily: "System",
  },
  sendButton: {
    borderRadius: 20,
  },
  sendGradient: {
    padding: 10,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});