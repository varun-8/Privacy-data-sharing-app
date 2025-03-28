import React, { useState, useContext, useEffect } from "react";
import {
    Text,
    TouchableOpacity,
    TextInput,
    View,
    Alert,
    StyleSheet,
    Animated,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { userContext } from "../../userContext";
import { urlContext } from "../../urlContext";
import { Ionicons } from "@expo/vector-icons";

export default function UserDash() {
    const navigation = useNavigation();
    const { cuser, setCuser } = useContext(userContext);
    const { url } = useContext(urlContext);

    const [cgroup, setCGroup] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recentGroups, setRecentGroups] = useState([]);
    const [recentFiles, setRecentFiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [fadeAnim] = useState(new Animated.Value(0));
    const [group, setGroup] = useState({ name: "", description: "", email: cuser || "" });
    const [userName, setUserName] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        if (cuser) {
            fetchUserName();
            fetchRecentGroups();
            fetchRecentFiles();
            setGroup((prev) => ({ ...prev, email: cuser }));
        }
    }, [cuser]);

    const fetchUserName = async () => {
        try {
            const res = await axios.get(`${url}/getusername/${cuser}`, { timeout: 5000 });
            setUserName(res.data.name || "User"); // Fallback to "User" if name not found
        } catch (err) {
            setUserName("User");
            setError("Failed to load user profile.");
        }
    };

    const fetchRecentGroups = async () => {
        try {
            const res = await axios.get(`${url}/getmygroups/${cuser}`, { timeout: 5000 });
            setRecentGroups(res.data.groups?.slice(0, 5) || []);
        } catch (err) {
            setRecentGroups([]);
            setError("Failed to load recent groups.");
        }
    };

    const fetchRecentFiles = async () => {
        try {
            const res = await axios.get(`${url}/getrecentfiles/${cuser}`, { timeout: 5000 });
            setRecentFiles(res.data.files?.slice(0, 5) || []);
        } catch (err) {
            setRecentFiles([]);
            setError("Failed to load recent files.");
        }
    };

    const handleCreateGroup = async () => {
        if (!group.name || !group.description) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await axios.post(`${url}/requestCreate`, group, { timeout: 5000 });
            Alert.alert("Success", res.data.message);
            setGroup({ name: "", description: "", email: cuser || "" });
            setCGroup(false);
            fetchRecentGroups();
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Failed to create group.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickShare = () => {
        if (recentGroups.length > 0) {
            navigation.navigate("sharefiles", { name: recentGroups[0].name });
        } else {
            Alert.alert("No Groups", "Create a group first to share files.");
        }
    };

    const handleLogout = () => {
        setCuser(null);
        navigation.navigate("userlogin");
    };

    const handleRefresh = () => {
        if (cuser) {
            fetchRecentGroups();
            fetchRecentFiles();
            Alert.alert("Refreshed", "Dashboard updated.");
        }
    };

    const filterItems = (items, query) =>
        items.filter((item) =>
            item.name?.toLowerCase().includes(query.toLowerCase()) ||
            item.file_name?.toLowerCase().includes(query.toLowerCase())
        );

    if (!cuser) {
        return (
            <LinearGradient colors={["#F7FAFC", "#E5E7EB"]} style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Please log in to continue...</Text>
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => navigation.navigate("userlogin")}
                >
                    <Text style={styles.loginButtonText}>Go to Login</Text>
                </TouchableOpacity>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={["#F7FAFC", "#E5E7EB"]} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View style={{ opacity: fadeAnim }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Welcome, {userName}</Text>
                        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                            <Ionicons name="refresh" size={22} color="#3B82F6" />
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search groups or files..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    {/* Error Message */}
                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Quick Actions */}
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setCGroup(!cgroup)}
                        >
                            <LinearGradient
                                colors={["#3B82F6", "#60A5FA"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.actionGradient}
                            >
                                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                                <Text style={styles.actionText}>{cgroup ? "Cancel" : "New Group"}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={handleQuickShare}>
                            <LinearGradient
                                colors={["#3B82F6", "#60A5FA"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.actionGradient}
                            >
                                <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                                <Text style={styles.actionText}>Quick Share</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Create Group Form */}
                    {cgroup && (
                        <View style={styles.formContainer}>
                            <TextInput
                                placeholder="Group Name"
                                value={group.name}
                                onChangeText={(value) => setGroup({ ...group, name: value })}
                                style={styles.input}
                                placeholderTextColor="#9CA3AF"
                            />
                            <TextInput
                                placeholder="Group Description"
                                value={group.description}
                                onChangeText={(value) => setGroup({ ...group, description: value })}
                                style={[styles.input, styles.textArea]}
                                multiline
                                placeholderTextColor="#9CA3AF"
                            />
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleCreateGroup}
                                disabled={isSubmitting}
                            >
                                <LinearGradient
                                    colors={isSubmitting ? ["#9CA3AF", "#9CA3AF"] : ["#3B82F6", "#60A5FA"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.submitGradient}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Create Group</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Navigation Buttons */}
                    <View style={styles.navButtons}>
                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigation.navigate("viewyourgroups")}
                        >
                            <Ionicons name="albums-outline" size={20} color="#3B82F6" />
                            <Text style={styles.navButtonText}>My Groups</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigation.navigate("viewallgroups")}
                        >
                            <Ionicons name="earth-outline" size={20} color="#3B82F6" />
                            <Text style={styles.navButtonText}>Explore Groups</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigation.navigate("viewuserrequests")}
                        >
                            <Ionicons name="mail-outline" size={20} color="#3B82F6" />
                            <Text style={styles.navButtonText}>My Requests</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigation.navigate("viewjoinrequests")}
                        >
                            <Ionicons name="person-add-outline" size={20} color="#3B82F6" />
                            <Text style={styles.navButtonText}>Join Requests</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Recent Groups */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent Groups</Text>
                        {filterItems(recentGroups, searchQuery).length > 0 ? (
                            filterItems(recentGroups, searchQuery).map((group) => (
                                <TouchableOpacity
                                    key={group.id}
                                    style={styles.itemCard}
                                    onPress={() => navigation.navigate("seefiles", { gid: group.id })}
                                >
                                    <Ionicons name="folder-outline" size={24} color="#3B82F6" />
                                    <Text style={styles.itemName}>{group.name}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.noDataText}>
                                {searchQuery ? "No matching groups found." : "No groups yet. Create one!"}
                            </Text>
                        )}
                    </View>

                    {/* Recent Files (Non-Interactive) */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent Files</Text>
                        {filterItems(recentFiles, searchQuery).length > 0 ? (
                            filterItems(recentFiles, searchQuery).map((file) => (
                                <View key={file._id} style={styles.itemCard}>
                                    <Ionicons name="document-outline" size={24} color="#3B82F6" />
                                    <Text style={styles.itemName}>{file.file_name}</Text>
                                    <Text style={styles.itemSubText}>{file.user_name}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noDataText}>
                                {searchQuery ? "No matching files found." : "No recent files yet."}
                            </Text>
                        )}
                    </View>

                    {/* Logout */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <LinearGradient
                            colors={["#EF4444", "#F87171"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.logoutGradient}
                        >
                            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.logoutText}>Logout</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#D1D5DB",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: "#1A202C",
        fontFamily: "System",
    },
    refreshButton: {
        padding: 10,
        backgroundColor: "#F3F4F6",
        borderRadius: 50,
        borderWidth: 1,
        borderColor: "#D1D5DB",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        marginHorizontal: 20,
        marginVertical: 15,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        elevation: 2,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: "#1A202C",
        paddingVertical: 12,
        fontFamily: "System",
    },
    quickActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginVertical: 15,
    },
    actionButton: {
        flex: 1,
        marginHorizontal: 5,
        borderRadius: 25,
    },
    actionGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 25,
        elevation: 3,
    },
    actionText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 10,
        fontFamily: "System",
    },
    formContainer: {
        backgroundColor: "#FFFFFF",
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        elevation: 3,
    },
    input: {
        width: "100%",
        borderColor: "#D1D5DB",
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: "#1A202C",
        backgroundColor: "#F9FAFB",
        marginBottom: 15,
        fontFamily: "System",
    },
    textArea: {
        height: 120,
        textAlignVertical: "top",
    },
    submitButton: {
        borderRadius: 25,
    },
    submitGradient: {
        paddingVertical: 14,
        paddingHorizontal: 25,
        borderRadius: 25,
        alignItems: "center",
        elevation: 3,
    },
    submitButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
        fontFamily: "System",
    },
    navButtons: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginVertical: 15,
    },
    navButton: {
        width: "48%",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 14,
        marginBottom: 10,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        elevation: 2,
    },
    navButtonText: {
        fontSize: 16,
        color: "#3B82F6",
        marginLeft: 10,
        fontFamily: "System",
    },
    section: {
        marginVertical: 15,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1A202C",
        marginBottom: 10,
        fontFamily: "System",
    },
    itemCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 15,
        marginBottom: 10,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        elevation: 2,
    },
    itemName: {
        fontSize: 16,
        color: "#1A202C",
        marginLeft: 12,
        flex: 1,
        fontFamily: "System",
    },
    itemSubText: {
        fontSize: 14,
        color: "#6B7280",
        fontFamily: "System",
    },
    noDataText: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        marginVertical: 15,
        fontFamily: "System",
    },
    logoutButton: {
        marginHorizontal: 20,
        marginVertical: 15,
        borderRadius: 25,
    },
    logoutGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        paddingHorizontal: 25,
        borderRadius: 25,
        elevation: 3,
    },
    logoutText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 10,
        fontFamily: "System",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        fontSize: 16,
        color: "#3B82F6",
        marginTop: 15,
        fontFamily: "System",
    },
    loginButton: {
        backgroundColor: "#3B82F6",
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 25,
        marginTop: 20,
    },
    loginButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
        fontFamily: "System",
    },
    errorContainer: {
        backgroundColor: "#FEE2E2",
        padding: 10,
        marginHorizontal: 20,
        borderRadius: 10,
        marginBottom: 15,
    },
    errorText: {
        color: "#EF4444",
        fontSize: 14,
        fontFamily: "System",
    },
});