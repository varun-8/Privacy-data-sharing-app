import { useState, useEffect, useContext } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";
import { Ionicons } from "@expo/vector-icons";

export default function Sdash() {
  const navigation = useNavigation();
  const { url } = useContext(urlContext);
  const { cuser, setCuser } = useContext(userContext);

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
  const [userName, setUserName] = useState("Guest");
  const [retryAttempts, setRetryAttempts] = useState({ stats: 0, failedLogins: 0, health: 0 });

  const MAX_RETRIES = 3;

  // Fetch user's name
  const fetchUserName = async () => {
    if (!cuser || typeof cuser !== "string" || !cuser.includes("@")) {
      console.warn("Invalid cuser:", cuser);
      setUserName("Guest");
      return;
    }
    try {
      const res = await axios.get(`${url}/getusername/${cuser}`, { timeout: 5000 });
      setUserName(res.data.name || cuser.split("@")[0]);
    } catch (err) {
      console.error("Error fetching user name:", err.response?.data || err.message);
      setUserName(cuser.split("@")[0] || "Guest");
      setErrorStats("Couldn’t fetch your name. Using default.");
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await axios.get(`${url}/stats`, { timeout: 5000 });
      setStats({
        pending: res.data.pending || 0,
        approved: res.data.approved || 0,
        rejected: res.data.rejected || 0,
      });
      setErrorStats(null);
      setRetryAttempts((prev) => ({ ...prev, stats: 0 }));
    } catch (err) {
      console.error("Error fetching stats:", err.response?.data || err.message);
      const attempt = retryAttempts.stats + 1;
      setRetryAttempts((prev) => ({ ...prev, stats: attempt }));
      if (attempt < MAX_RETRIES) {
        setTimeout(fetchStats, 2000);
      } else {
        setErrorStats(getErrorMessage(err, "stats"));
      }
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch failed login attempts count
  const fetchFailedLoginsCount = async () => {
    setLoadingFailedLogins(true);
    try {
      const res = await axios.get(`${url}/failed-logins`, { timeout: 5000 });
      setFailedLoginCount(res.data.failed_logins?.length || 0);
      setErrorFailedLogins(null);
      setRetryAttempts((prev) => ({ ...prev, failedLogins: 0 }));
    } catch (err) {
      console.error("Error fetching failed logins:", err.response?.data || err.message);
      const attempt = retryAttempts.failedLogins + 1;
      setRetryAttempts((prev) => ({ ...prev, failedLogins: attempt }));
      if (attempt < MAX_RETRIES) {
        setTimeout(fetchFailedLoginsCount, 2000);
      } else {
        setErrorFailedLogins(getErrorMessage(err, "failed logins"));
      }
    } finally {
      setLoadingFailedLogins(false);
    }
  };

  // Fetch server health
  const fetchServerHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await axios.get(`${url}/server-health`, { timeout: 5000 });
      setServerHealth({
        uptime: res.data.uptime || 0,
        active_users: res.data.active_users || 0,
      });
      setErrorHealth(null);
      setRetryAttempts((prev) => ({ ...prev, health: 0 }));
    } catch (err) {
      console.error("Error fetching server health:", err.response?.data || err.message);
      const attempt = retryAttempts.health + 1;
      setRetryAttempts((prev) => ({ ...prev, health: attempt }));
      if (attempt < MAX_RETRIES) {
        setTimeout(fetchServerHealth, 2000);
      } else {
        setErrorHealth(getErrorMessage(err, "server health"));
      }
    } finally {
      setLoadingHealth(false);
    }
  };

  // Helper to generate user-friendly error messages
  const getErrorMessage = (err, context) => {
    if (err.code === "ECONNABORTED") return `Timed out loading ${context}. Check your connection.`;
    if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") return `Server unreachable for ${context}.`;
    return err.response?.data?.message || `Failed to load ${context}.`;
  };

  // Logout handler with API call
  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.post(
                `${url}/logout`,
                { email: cuser },
                { timeout: 5000, headers: { "Content-Type": "application/json" } }
              );
              console.log(`Logged out ${cuser} successfully`);
            } catch (err) {
              console.error("Logout error:", err.response?.data || err.message);
              Alert.alert("Error", "Failed to logout on server. Proceeding locally.");
            }
            setCuser(null);
            navigation.reset({
              index: 0,
              routes: [{ name: "slogin" }], // Redirect to super admin login
            });
          },
        },
      ]
    );
  };

  useEffect(() => {
    console.log("cuser in useEffect:", cuser);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hello, {userName}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.warningIconContainer} onPress={handleFailedLoginsPress}>
            <Ionicons
              name="warning-outline"
              size={26}
              color={failedLoginCount > 0 ? "#DC3545" : "#6C757D"}
            />
            {failedLoginCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{failedLoginCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={26} color="#DC3545" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>System Stats</Text>
        {loadingStats ? (
          <Text style={styles.statsText}>Loading stats...</Text>
        ) : errorStats ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorStats}</Text>
            <TouchableOpacity onPress={fetchStats} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
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
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorHealth}</Text>
            <TouchableOpacity onPress={fetchServerHealth} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  warningIconContainer: {
    position: "relative",
    padding: 6,
    marginRight: 10,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
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
  },
  logoutButton: {
    padding: 6,
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 12,
    textAlign: "left",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: "#6C757D",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A8A",
    marginTop: 4,
  },
  statsText: {
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
  },
  errorContainer: {
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#DC3545",
    textAlign: "center",
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  quickActionButton: {
    backgroundColor: "#10B981",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginRight: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  quickActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  healthCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  healthGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  healthItem: {
    alignItems: "center",
    flex: 1,
  },
  healthLabel: {
    fontSize: 14,
    color: "#6C757D",
  },
  healthValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#10B981",
    marginTop: 4,
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 12,
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
  },
  complianceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  complianceText: {
    fontSize: 14,
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
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  complianceDetailText: {
    fontSize: 12,
    color: "#10B981",
    textAlign: "center",
  },
});