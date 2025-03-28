import { useState, useEffect, useContext } from "react";
import { Text, TouchableOpacity, View, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";
import { Ionicons } from "@expo/vector-icons";

export default function Sdash() {
    const navigation = useNavigation();
    const { url } = useContext(urlContext);
    const { cuser } = useContext(userContext);

    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [failedLoginCount, setFailedLoginCount] = useState(0);
    const [serverHealth, setServerHealth] = useState({ uptime: 0, active_users: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingFailedLogins, setLoadingFailedLogins] = useState(true);
    const [loadingHealth, setLoadingHealth] = useState(true);
    const [errorStats, setErrorStats] = useState(null);
    const [errorFailedLogins, setErrorFailedLogins] = useState(null);
    const [errorHealth, setErrorHealth] = useState(null);
    const [showComplianceDetails, setShowComplianceDetails] = useState(false);
    const [userName, setUserName] = useState("Guest"); // Default to "Guest"

    // Fetch user's name
    const fetchUserName = async () => {
        if (!cuser || typeof cuser !== "string" || !cuser.includes("@")) {
            console.warn("Invalid cuser:", cuser);
            setUserName("Guest");
            return;
        }
        try {
            const res = await axios.get(`${url}/getusername/${cuser}`, { timeout: 5000 });
            setUserName(res.data.name || cuser.split('@')[0]);
        } catch (err) {
            console.error("Error fetching user name:", err.response?.data || err.message);
            setUserName(cuser.split('@')[0] || "Guest");
        }
    };

    // Fetch stats
    const fetchStats = async () => {
        try {
            const res = await axios.get(`${url}/stats`, { timeout: 5000 });
            setStats({
                pending: res.data.pending || 0,
                approved: res.data.approved || 0,
                rejected: res.data.rejected || 0,
            });
        } catch (err) {
            setErrorStats("Failed to load stats.");
        } finally {
            setLoadingStats(false);
        }
    };

    // Fetch failed login attempts count
    const fetchFailedLoginsCount = async () => {
        try {
            const res = await axios.get(`${url}/failed-logins`, { timeout: 5000 });
            setFailedLoginCount(res.data.failed_logins.length || 0);
        } catch (err) {
            setErrorFailedLogins("Failed to load failed login count.");
        } finally {
            setLoadingFailedLogins(false);
        }
    };

    // Fetch server health
    const fetchServerHealth = async () => {
        try {
            const res = await axios.get(`${url}/server-health`, { timeout: 5000 });
            setServerHealth({
                uptime: res.data.uptime || 0,
                active_users: res.data.active_users || 0,
            });
        } catch (err) {
            setErrorHealth("Failed to load server health.");
        } finally {
            setLoadingHealth(false);
        }
    };

    useEffect(() => {
        console.log("cuser in useEffect:", cuser); // Debug cuser
        fetchUserName();
        fetchStats();
        fetchFailedLoginsCount();
        fetchServerHealth();

        const interval = setInterval(() => {
            fetchFailedLoginsCount();
            fetchServerHealth();
        }, 10000);
        return () => clearInterval(interval);
    }, [cuser]);

    // Navigation handlers
    const handleRequestsPress = () => navigation.navigate("viewrequests");
    const handleUsersPress = () => navigation.navigate("manageusers");
    const handleGroupsPress = () => navigation.navigate("managegroups");
    const handleSettingsPress = () => navigation.navigate("settings");
    const handleFailedLoginsPress = () => navigation.navigate("failedlogins");
    const handleAddUserPress = () => navigation.navigate("manageusers");
    const handleCreateGroupPress = () => navigation.navigate("managegroups");
    const handleAddAdminPress = () => navigation.navigate("sregister");

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.header}>
                <Text style={styles.title}>Hello, {userName}</Text>
                <TouchableOpacity style={styles.warningIconContainer} onPress={handleFailedLoginsPress}>
                    <Ionicons
                        name="warning-outline"
                        size={26} // Fixed typo
                        color={failedLoginCount > 0 ? "#DC3545" : "#6C757D"}
                    />
                    {failedLoginCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{failedLoginCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Stats Section */}
            <View style={styles.statsCard}>
                <Text style={styles.sectionTitle}>System Stats</Text>
                {loadingStats ? (
                    <Text style={styles.statsText}>Loading stats...</Text>
                ) : errorStats ? (
                    <Text style={styles.errorText}>{errorStats}</Text>
                ) : (
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Pending Requests</Text>
                            <Text style={styles.statValue}>{stats.pending}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Approved Groups</Text>
                            <Text style={styles.statValue}>{stats.approved}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Rejected Requests</Text>
                            <Text style={styles.statValue}>{stats.rejected}</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Quick Actions Bar */}
            <View style={styles.quickActionsContainer}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity style={styles.quickActionButton} onPress={handleAddUserPress}>
                        <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.quickActionText}>Add User</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton} onPress={handleCreateGroupPress}>
                        <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.quickActionText}>Create Group</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton} onPress={handleRequestsPress}>
                        <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.quickActionText}>Review Requests</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton} onPress={handleAddAdminPress}>
                        <Ionicons name="person-circle-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.quickActionText}>Add Admin</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* System Health Widget */}
            <View style={styles.healthCard}>
                <Text style={styles.sectionTitle}>System Health</Text>
                {loadingHealth ? (
                    <Text style={styles.statsText}>Loading health data...</Text>
                ) : errorHealth ? (
                    <Text style={styles.errorText}>{errorHealth}</Text>
                ) : (
                    <View style={styles.healthGrid}>
                        <View style={styles.healthItem}>
                            <Text style={styles.healthLabel}>Server Uptime</Text>
                            <Text style={styles.healthValue}>{serverHealth.uptime}%</Text>
                        </View>
                        <View style={styles.healthItem}>
                            <Text style={styles.healthLabel}>Total Users</Text>
                            <Text style={styles.healthValue}>{serverHealth.active_users}</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Buttons Section */}
            <View style={styles.buttonGrid}>
                <TouchableOpacity style={styles.button} onPress={handleRequestsPress}>
                    <Ionicons name="document-text-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.buttonText}>View Requests</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleUsersPress}>
                    <Ionicons name="people-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Manage Users</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleGroupsPress}>
                    <Ionicons name="albums-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Manage Groups</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleSettingsPress}>
                    <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleFailedLoginsPress}>
                    <Ionicons name="alert-circle-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Failed Logins</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleAddAdminPress}>
                    <Ionicons name="person-circle-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Add Admin</Text>
                </TouchableOpacity>
            </View>

            {/* Compliance Section */}
            <TouchableOpacity
                style={styles.complianceContainer}
                onPress={() => setShowComplianceDetails(!showComplianceDetails)}
            >
                <Text style={styles.complianceText}>Compliance Status:</Text>
                <View style={styles.statusIndicator} />
                <Text style={styles.complianceText}>GDPR Compliant</Text>
            </TouchableOpacity>
            {showComplianceDetails && (
                <View style={styles.complianceDetails}>
                    <Text style={styles.complianceDetailText}>
                        Last Audit: 2025-03-25 | Status: All systems compliant with GDPR and CCPA.
                    </Text>
                </View>
            )}
        </ScrollView>
    );
}

// Styles remain unchanged (omitted for brevity)

// Styles remain unchanged
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },
    contentContainer: {
        padding: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        fontFamily: "Poppins",
        color: "#1E3A8A",
    },
    warningIconContainer: {
        position: "relative",
        padding: 5,
    },
    badge: {
        position: "absolute",
        top: 0,
        right: 0,
        backgroundColor: "#DC3545",
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    badgeText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "bold",
        fontFamily: "Poppins",
    },
    statsCard: {
        backgroundColor: "#FFFFFF",
        padding: 20,
        borderRadius: 15,
        marginBottom: 15,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "600",
        fontFamily: "Poppins",
        color: "#1E3A8A",
        marginBottom: 15,
        textAlign: "center",
    },
    statsGrid: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    statItem: {
        alignItems: "center",
    },
    statLabel: {
        fontSize: 14,
        fontFamily: "Poppins",
        color: "#6C757D",
    },
    statValue: {
        fontSize: 22,
        fontWeight: "700",
        fontFamily: "Poppins",
        color: "#1E3A8A",
    },
    statsText: {
        fontSize: 14,
        fontFamily: "Poppins",
        color: "#6C757D",
        textAlign: "center",
    },
    errorText: {
        fontSize: 14,
        fontFamily: "Poppins",
        color: "#DC3545",
        textAlign: "center",
    },
    quickActionsContainer: {
        marginBottom: 15,
    },
    quickActionButton: {
        backgroundColor: "#10B981",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginRight: 10,
        flexDirection: "row",
        alignItems: "center",
    },
    quickActionText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "500",
        fontFamily: "Poppins",
        marginLeft: 8,
    },
    healthCard: {
        backgroundColor: "#FFFFFF",
        padding: 20,
        borderRadius: 15,
        marginBottom: 15,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    healthGrid: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    healthItem: {
        alignItems: "center",
    },
    healthLabel: {
        fontSize: 14,
        fontFamily: "Poppins",
        color: "#6C757D",
    },
    healthValue: {
        fontSize: 20,
        fontWeight: "700",
        fontFamily: "Poppins",
        color: "#10B981",
    },
    buttonGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    button: {
        backgroundColor: "#3B82F6",
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginVertical: 8,
        width: "48%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "500",
        fontFamily: "Poppins",
        marginLeft: 10,
    },
    complianceContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 15,
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    complianceText: {
        fontSize: 14,
        fontFamily: "Poppins",
        color: "#6C757D",
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#10B981",
        marginHorizontal: 8,
    },
    complianceDetails: {
        backgroundColor: "#E6FFFA",
        padding: 10,
        borderRadius: 10,
        marginTop: 5,
    },
    complianceDetailText: {
        fontSize: 12,
        fontFamily: "Poppins",
        color: "#10B981",
        textAlign: "center",
    },
});