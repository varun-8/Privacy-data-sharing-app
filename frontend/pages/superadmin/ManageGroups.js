import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { urlContext } from "../../urlContext";
import {
    FlatList,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function ManageGroups() {
    const { url } = useContext(urlContext);
    const [groups, setGroups] = useState([]);
    const [newGroup, setNewGroup] = useState({ name: "", admin_email: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [expandedGroup, setExpandedGroup] = useState(null);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${url}/groups`, { timeout: 5000 });
            const fetchedGroups = res.data.groups || [];
            if (!Array.isArray(fetchedGroups)) throw new Error("Invalid groups data");
            setGroups(fetchedGroups);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to fetch groups.");
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${url}/users`, { timeout: 5000 });
            const fetchedUsers = res.data.users || [];
            if (!Array.isArray(fetchedUsers)) throw new Error("Invalid users data");
            setUsers(fetchedUsers);
        } catch (err) {
            Alert.alert("Error", "Failed to fetch users.");
        }
    };

    useEffect(() => {
        fetchGroups();
        fetchUsers();
    }, []);

    const handleAddGroup = async () => {
        if (!newGroup.name || !newGroup.admin_email) {
            Alert.alert("Missing Fields", "Please enter both group name and admin email.");
            return;
        }
        try {
            const res = await axios.post(`${url}/add-group`, newGroup, {
                timeout: 5000,
                headers: { "Content-Type": "application/json" },
            });
            Alert.alert("Success", res.data.message);
            setNewGroup({ name: "", admin_email: "" });
            fetchGroups();
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Failed to add group.");
        }
    };

    const handleRemoveGroup = (groupId) => {
        Alert.alert(
            "Confirm Removal",
            "Are you sure you want to remove this group?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const res = await axios.delete(`${url}/remove-group/${groupId}`, { timeout: 5000 });
                            Alert.alert("Success", res.data.message);
                            fetchGroups();
                        } catch (err) {
                            Alert.alert("Error", err.response?.data?.message || "Failed to remove group.");
                        }
                    },
                },
            ]
        );
    };

    const toggleGroupDetails = (groupId) => {
        setExpandedGroup(expandedGroup === groupId ? null : groupId);
    };

    const getAdminName = (adminEmail) => {
        const user = users.find((u) => u.email === adminEmail);
        return user ? user.name : adminEmail; // Fallback to email if name not found
    };

    const getMemberNames = (memberIds) => {
        return memberIds.map((id) => {
            const user = users.find((u) => u.id === id);
            return user ? user.name : "Unknown User";
        });
    };

    const renderGroupItem = ({ item }) => {
        const memberNames = getMemberNames(item.members);
        const adminName = getAdminName(item.admin);
        const isExpanded = expandedGroup === item.id;

        return (
            <View style={styles.groupCard}>
                <TouchableOpacity style={styles.groupHeader} onPress={() => toggleGroupDetails(item.id)}>
                    <Text style={styles.groupName}>{item.name}</Text>
                    <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#64748B"
                    />
                </TouchableOpacity>
                <Text style={styles.groupAdmin}>Admin: {adminName}</Text>
                {isExpanded && (
                    <View style={styles.memberDetails}>
                        <Text style={styles.memberCount}>Members ({item.members.length}):</Text>
                        {memberNames.map((name, index) => (
                            <Text key={index} style={styles.memberEmail}>- {name}</Text>
                        ))}
                    </View>
                )}
                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveGroup(item.id)}
                >
                    <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.center}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Loading Groups...</Text>
            </LinearGradient>
        );
    }

    if (error) {
        return (
            <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchGroups}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Groups</Text>
            </View>
            <View style={styles.formContainer}>
                <View style={styles.inputWrapper}>
                    <Ionicons name="people-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Group Name"
                        value={newGroup.name}
                        onChangeText={(text) => setNewGroup({ ...newGroup, name: text })}
                        placeholderTextColor="#94A3B8"
                    />
                </View>
                <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Admin Email"
                        value={newGroup.admin_email}
                        onChangeText={(text) => setNewGroup({ ...newGroup, admin_email: text })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#94A3B8"
                    />
                </View>
                <TouchableOpacity style={styles.addButton} onPress={handleAddGroup}>
                    <LinearGradient
                        colors={["#10B981", "#22C55E"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                        <Text style={styles.addButtonText}>Add Group</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
            <FlatList
                data={groups}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderGroupItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="folder-open-outline" size={60} color="#64748B" />
                        <Text style={styles.emptyText}>No groups found</Text>
                    </View>
                }
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 40,
        paddingBottom: 20,
        alignItems: "center",
        backgroundColor: "transparent",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#FFFFFF",
        fontFamily: "System",
    },
    formContainer: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderColor: "#D1D5DB",
        borderWidth: 1,
        borderRadius: 12,
        backgroundColor: "#F9FAFB",
        marginBottom: 16,
    },
    inputIcon: {
        marginLeft: 12,
    },
    input: {
        flex: 1,
        height: 50,
        paddingHorizontal: 12,
        fontSize: 16,
        color: "#1F2937",
        fontFamily: "System",
    },
    addButton: {
        borderRadius: 12,
        overflow: "hidden",
    },
    buttonGradient: {
        flexDirection: "row",
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonIcon: {
        marginRight: 8,
    },
    addButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
        fontFamily: "System",
    },
    groupCard: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    groupHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    groupName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1F2937",
        fontFamily: "System",
    },
    groupAdmin: {
        fontSize: 14,
        color: "#64748B",
        marginTop: 8,
        fontFamily: "System",
    },
    memberDetails: {
        marginTop: 12,
        padding: 12,
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
    },
    memberCount: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1F2937",
        fontFamily: "System",
    },
    memberEmail: {  // Kept name for consistency, but now displays names
        fontSize: 14,
        color: "#64748B",
        marginTop: 4,
        fontFamily: "System",
    },
    removeButton: {
        flexDirection: "row",
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: "#EF4444",
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    removeButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 8,
        fontFamily: "System",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: "500",
        color: "#FFFFFF",
        fontFamily: "System",
    },
    errorText: {
        fontSize: 16,
        color: "#FFFFFF",
        textAlign: "center",
        marginBottom: 20,
        fontFamily: "System",
    },
    retryButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: "#F59E0B",
        borderRadius: 8,
    },
    retryButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
        fontFamily: "System",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "500",
        color: "#FFFFFF",
        marginTop: 12,
        fontFamily: "System",
    },
    listContent: {
        paddingBottom: 20,
    },
});