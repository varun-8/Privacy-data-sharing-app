import { useState, useEffect, useContext } from "react";
import { Text, TouchableOpacity, View, StyleSheet, ScrollView, Alert, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { urlContext } from "../../urlContext";
import { Ionicons } from "@expo/vector-icons";

export default function FailedLogins() {
    const navigation = useNavigation();
    const { url } = useContext(urlContext);
    const [failedLogins, setFailedLogins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch failed login attempts from the backend
    const fetchFailedLogins = async () => {
        try {
            setLoading(true);
            setError(null); // Clear previous errors
            const res = await axios.get(`${url}/failed-logins`, { timeout: 5000 });
            if (!Array.isArray(res.data.failed_logins)) {
                throw new Error("Invalid response format: failed_logins is not an array");
            }
            setFailedLogins(res.data.failed_logins);
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || "Unknown error";
            console.error("Error fetching failed logins:", errorMessage);
            setError(`Failed to load failed login attempts: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // Block an IP address
    const blockIp = async (ipAddress) => {
        Alert.alert(
            "Confirm Block",
            `Are you sure you want to block IP ${ipAddress}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Block",
                    onPress: async () => {
                        try {
                            const res = await axios.post(`${url}/block-ip`, { ip_address: ipAddress });
                            Alert.alert("Success", res.data.message || `IP ${ipAddress} has been blocked.`);
                            await fetchFailedLogins();
                        } catch (err) {
                            const errorMessage = err.response?.data?.error || err.message || "Unknown error";
                            console.error("Error blocking IP:", errorMessage);
                            Alert.alert("Error", `Failed to block IP: ${errorMessage}`);
                        }
                    },
                },
            ]
        );
    };

    // Allow (unblock) an IP address
    const allowIp = async (ipAddress) => {
        Alert.alert(
            "Confirm Allow",
            `Are you sure you want to allow IP ${ipAddress}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Allow",
                    onPress: async () => {
                        try {
                            const res = await axios.post(`${url}/allow-ip`, { ip_address: ipAddress });
                            Alert.alert("Success", res.data.message || `IP ${ipAddress} has been allowed.`);
                            await fetchFailedLogins();
                        } catch (err) {
                            const errorMessage = err.response?.data?.error || err.message || "Unknown error";
                            console.error("Error allowing IP:", errorMessage);
                            Alert.alert("Error", `Failed to allow IP: ${errorMessage}`);
                        }
                    },
                },
            ]
        );
    };

    // Load data on mount and refresh every 10 seconds
    useEffect(() => {
        fetchFailedLogins();
        const interval = setInterval(fetchFailedLogins, 10000);
        return () => clearInterval(interval);
    }, [url]); // Added url as dependency

    // Case-insensitive filter for blocked and unblocked IPs
    const filteredBlockedIps = failedLogins.filter((attempt) => {
        const query = searchQuery.toLowerCase();
        return (
            attempt.blocked === true &&
            (attempt.ip_address.toLowerCase().includes(query) ||
             attempt.username.toLowerCase().includes(query))
        );
    });
    const filteredFailedLogins = failedLogins.filter((attempt) => {
        const query = searchQuery.toLowerCase();
        return (
            attempt.blocked === false &&
            (attempt.ip_address.toLowerCase().includes(query) ||
             attempt.username.toLowerCase().includes(query))
        );
    });

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Failed Login Attempts</Text>

            <TextInput
                style={styles.searchBar}
                placeholder="Search by IP or Username..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            {/* Blocked IPs Section */}
            <View style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Blocked IPs</Text>
                    <TouchableOpacity style={styles.refreshButton} onPress={fetchFailedLogins}>
                        <Ionicons name="refresh" size={20} color="#FFFFFF" />
                        <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
                {loading ? (
                    <Text style={styles.loadingText}>Loading blocked IPs...</Text>
                ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : filteredBlockedIps.length === 0 ? (
                    <Text style={styles.infoText}>No IPs are currently blocked.</Text>
                ) : (
                    filteredBlockedIps.map((attempt) => (
                        <View
                            key={`${attempt.ip_address}-${attempt.username}`} // Unique key
                            style={styles.attemptItem}
                        >
                            <View style={styles.attemptDetails}>
                                <Text style={styles.attemptText}>IP: {attempt.ip_address}</Text>
                                <Text style={styles.attemptText}>Username: {attempt.username}</Text>
                                <Text style={styles.attemptText}>Attempts: {attempt.attempts}</Text>
                                <Text style={styles.attemptText}>
                                    Last Attempt: {new Date(attempt.last_attempt).toLocaleString()}
                                </Text>
                                <Text style={styles.attemptText}>
                                    Blocked On: {new Date(attempt.last_updated).toLocaleString()}
                                </Text>
                                <Text
                                    style={[
                                        styles.statusBadge,
                                        attempt.status === "Active" ? styles.activeBadge : styles.blockedBadge,
                                    ]}
                                >
                                    {attempt.status || "Unknown"}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.allowButton]}
                                onPress={() => allowIp(attempt.ip_address)}
                            >
                                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                                <Text style={styles.actionButtonText}>Allow</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>

            {/* All Failed Logins Section */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>All Failed Login Attempts</Text>
                {loading ? (
                    <Text style={styles.loadingText}>Loading failed logins...</Text>
                ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : filteredFailedLogins.length === 0 ? (
                    <Text style={styles.infoText}>No active failed login attempts recorded.</Text>
                ) : (
                    filteredFailedLogins.map((attempt) => (
                        <View
                            key={`${attempt.ip_address}-${attempt.username}`} // Unique key
                            style={styles.attemptItem}
                        >
                            <View style={styles.attemptDetails}>
                                <Text style={styles.attemptText}>Username: {attempt.username}</Text>
                                <Text style={styles.attemptText}>Attempts: {attempt.attempts}</Text>
                                <Text style={styles.attemptText}>IP: {attempt.ip_address}</Text>
                                <Text style={styles.attemptText}>
                                    Last Attempt: {new Date(attempt.last_attempt).toLocaleString()}
                                </Text>
                                <Text
                                    style={[
                                        styles.statusBadge,
                                        attempt.status === "Active" ? styles.activeBadge : styles.blockedBadge,
                                    ]}
                                >
                                    {attempt.status || "Unknown"}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.blockButton]}
                                onPress={() => blockIp(attempt.ip_address)}
                            >
                                <Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />
                                <Text style={styles.actionButtonText}>Block</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#F7F9FC",
    },
    title: {
        fontSize: 26,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 20,
        color: "#1A3552",
        letterSpacing: 0.5,
    },
    searchBar: {
        backgroundColor: "#FFFFFF",
        padding: 10,
        borderRadius: 10,
        marginBottom: 20,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    card: {
        backgroundColor: "#FFFFFF",
        padding: 15,
        borderRadius: 12,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1A3552",
    },
    refreshButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#007BFF",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        elevation: 2,
    },
    refreshButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "500",
        marginLeft: 5,
    },
    loadingText: {
        fontSize: 16,
        color: "#1A3552",
        textAlign: "center",
    },
    errorText: {
        fontSize: 16,
        color: "#DC3545",
        textAlign: "center",
    },
    infoText: {
        fontSize: 16,
        color: "#1A3552",
        textAlign: "center",
    },
    attemptItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    attemptDetails: {
        flex: 2,
    },
    attemptText: {
        fontSize: 14,
        color: "#1A3552",
        marginVertical: 2,
    },
    statusBadge: {
        fontSize: 12,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 12,
        alignSelf: "flex-start",
        color: "#FFFFFF",
        marginTop: 4,
    },
    activeBadge: {
        backgroundColor: "#28A745", // Green for Active
    },
    blockedBadge: {
        backgroundColor: "#DC3545", // Red for Not Active
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        elevation: 2,
    },
    blockButton: {
        backgroundColor: "#DC3545", // Red for Block
    },
    allowButton: {
        backgroundColor: "#28A745", // Green for Allow
    },
    actionButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "500",
        marginLeft: 5,
    },
    backButton: {
        backgroundColor: "#2A5D8F",
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
        alignSelf: "center",
        marginTop: 20,
    },
    backButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "500",
    },
});