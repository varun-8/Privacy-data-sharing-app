import { useRoute } from "@react-navigation/native";
import axios from "axios";
import { useEffect, useState, useContext, useRef } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";
import { Ionicons } from "@expo/vector-icons";

export default function GroupChat() {
  const route = useRoute();
  const { gid, name } = route.params || {};

  const { url } = useContext(urlContext);
  const { cuser } = useContext(userContext);

  const [messages, setMessages] = useState([]);
  const [userNames, setUserNames] = useState({}); // { email: { name, isAdmin } }
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  // Fetch user name and admin status by email
  const fetchUserName = async (email) => {
    if (userNames[email]?.name) return userNames[email].name; // Return cached name if available
    try {
      const res = await axios.get(`${url}/getusername/${email}`);
      const userName = res.data.name || email.split('@')[0];
      const isAdmin = res.data.isAdmin || false; // Assume backend provides this field
      setUserNames((prev) => ({
        ...prev,
        [email]: { name: userName, isAdmin },
      }));
      return userName;
    } catch (error) {
      console.error(`Error fetching username for ${email}:`, error.response?.data || error.message);
      setUserNames((prev) => ({
        ...prev,
        [email]: { name: email.split('@')[0], isAdmin: false },
      }));
      return email.split('@')[0];
    }
  };

  // Fetch messages and user info
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${url}/getchatmessages/${gid}`, { timeout: 10000 });
      const messagesData = res.data.messages || [];
      setMessages(messagesData);

      const uniqueUsers = [...new Set(messagesData.map((msg) => msg.user))];
      for (const userEmail of uniqueUsers) {
        if (!userNames[userEmail]?.name) {
          await fetchUserName(userEmail);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error.response?.data || error.message);
      alert("Failed to fetch messages. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [gid]);

  // Send message
  const sendMessage = async () => {
    if (!message.trim()) {
      alert("Please type a message.");
      return;
    }

    setSending(true);
    try {
      await axios.post(`${url}/sendchatmessage`, {
        group_id: gid,
        user: cuser,
        message,
      });
      setMessage("");
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error.message);
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const renderItem = ({ item, index }) => {
    const isFirstMessageOfDay =
      index === messages.length - 1 ||
      new Date(messages[index + 1].timestamp).toDateString() !==
        new Date(item.timestamp).toDateString();
    const isMine = item.user === cuser;
    const userInfo = userNames[item.user] || { name: item.user.split('@')[0], isAdmin: false };
    const displayName = userInfo.name;

    return (
      <>
        {isFirstMessageOfDay && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>
              {new Date(item.timestamp).toLocaleDateString()}
            </Text>
          </View>
        )}
        <View style={[styles.messageContainer, isMine && styles.myMessageContainer]}>
          <View style={styles.userNameContainer}>
            <Text style={[styles.userName, isMine && styles.myUserName]}>
              {displayName}
            </Text>
            {userInfo.isAdmin && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={isMine ? "#A5B4FC" : "#94A3B8"}
                style={styles.adminTick}
              />
            )}
          </View>
          <View style={[styles.messageBubble, isMine && styles.myMessageBubble]}>
            <Text style={[styles.messageText, isMine && styles.myMessageText]}>
              {item.message}
            </Text>
          </View>
          <Text style={[styles.timestamp, isMine && styles.myTimestamp]}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </>
    );
  };

  return (
    <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>{name || `Group ${gid || "Chat"}`}</Text>
        <TouchableOpacity onPress={fetchMessages} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#CBD5E1" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#CBD5E1" />
          <Text style={styles.loadingText}>Loading Chat...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={60} color="#64748B" />
          <Text style={styles.emptyText}>No messages yet</Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
            inverted
          />
          <TouchableOpacity style={styles.scrollToBottomButton} onPress={scrollToBottom}>
            <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message..."
            value={message}
            onChangeText={setMessage}
            multiline
            editable={!sending}
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={sending}
          >
            <LinearGradient
              colors={sending ? ["#6B7280", "#6B7280"] : ["#10B981", "#22C55E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sendGradient}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
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
    backgroundColor: "#F8FAFC",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1E293B",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "System",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#334155",
  },
  chatList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  messageContainer: {
    marginBottom: 16,
    alignItems: "flex-start",
  },
  myMessageContainer: {
    alignItems: "flex-end",
  },
  userNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
  },
  myUserName: {
    color: "#A5B4FC",
  },
  adminTick: {
    marginLeft: 4,
  },
  messageBubble: {
    backgroundColor: "#E2E8F0",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    maxWidth: "75%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  myMessageBubble: {
    backgroundColor: "#22C55E",
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 22,
    fontFamily: "System",
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  timestamp: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  myTimestamp: {
    color: "#A5B4FC",
  },
  dateSeparator: {
    alignItems: "center",
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
    backgroundColor: "#475569",
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
    fontWeight: "500",
    color: "#CBD5E1",
    fontFamily: "System",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 12,
    fontFamily: "System",
  },
  scrollToBottomButton: {
    position: "absolute",
    bottom: 80,
    right: 16,
    backgroundColor: "#475569",
    padding: 10,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1E293B",
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxHeight: 100,
    fontFamily: "System",
  },
  sendButton: {
    borderRadius: 20,
  },
  sendGradient: {
    padding: 12,
    borderRadius: 20,
    elevation: 2,
  },
});