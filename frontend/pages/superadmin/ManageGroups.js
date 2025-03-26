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

export default function ManageGroups() {
    const { url } = useContext(urlContext);
    const [groups, setGroups] = useState([]);
    const [newGroup, setNewGroup] = useState({ name: "", admin_email: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]); // Store all users for mapping IDs to emails
    const [expandedGroup, setExpandedGroup] = useState(null); // Track which group is expanded

    const fetchGroups = async () => {
        setLoading(true);
        try {
            console.log("Fetching from URL:", `${url}/groups`);
            const res = await axios.get(`${url}/groups`, { timeout: 5000 });
            console.log("Fetch Groups Response:", res.data);
            const fetchedGroups = res.data.groups || [];
            if (!Array.isArray(fetchedGroups)) {
                throw new Error("Response is not an array of groups");
            }
            setGroups(fetchedGroups);
            setError(null);
        } catch (err) {
            console.error("Fetch Groups Error:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
            });
            setError(err.response?.data?.error || "Error fetching groups. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${url}/users`, { timeout: 5000 });
            console.log("Fetch Users Response:", res.data);
            const fetchedUsers = res.data.users || [];
            if (!Array.isArray(fetchedUsers)) {
                throw new Error("Response is not an array of users");
            }
            setUsers(fetchedUsers);
        } catch (err) {
            console.error("Fetch Users Error:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
            });
            Alert.alert("Error", "Failed to fetch users for member details.");
        }
    };

    useEffect(() => {
        fetchGroups();
        fetchUsers(); // Fetch users once on mount
    }, []);

    const handleAddGroup = async () => {
        if (!newGroup.name || !newGroup.admin_email) {
            Alert.alert("Error", "Please enter both group name and admin email.");
            return;
        }
        try {
            const res = await axios.post(
                `${url}/add-group`,
                { name: newGroup.name, admin_email: newGroup.admin_email },
                {
                    timeout: 5000,
                    headers: { "Content-Type": "application/json" },
                }
            );
            Alert.alert("Success", res.data.message);
            setNewGroup({ name: "", admin_email: "" });
            fetchGroups();
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Failed to add group.");
        }
    };

    const handleRemoveGroup = async (groupId) => {
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
                            const res = await axios.delete(`${url}/remove-group/${groupId}`, {
                                timeout: 5000,
                            });
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

    const getMemberEmails = (memberIds) => {
        return memberIds.map((id) => {
            const user = users.find((u) => u.id === id);
            return user ? user.email : "Unknown User";
        });
    };

    const renderGroupItem = ({ item }) => {
        const memberEmails = getMemberEmails(item.members);
        const isExpanded = expandedGroup === item.id;

        return (
            <View style={styles.groupCard}>
                <TouchableOpacity onPress={() => toggleGroupDetails(item.id)}>
                    <Text style={styles.groupName}>{item.name}</Text>
                </TouchableOpacity>
                <Text style={styles.groupAdmin}>Admin: {item.admin}</Text>
                {isExpanded && (
                    <View style={styles.memberDetails}>
                        <Text style={styles.memberCount}>Members: {item.members.length}</Text>
                        {memberEmails.map((email, index) => (
                            <Text key={index} style={styles.memberEmail}>
                                - {email}
                            </Text>
                        ))}
                    </View>
                )}
                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveGroup(item.id)}
                >
                    <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0057D8" />
                <Text style={styles.loadingText}>Loading Groups...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchGroups}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Groups</Text>
            </View>
            <View style={styles.formContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter group name"
                    value={newGroup.name}
                    onChangeText={(text) => setNewGroup({ ...newGroup, name: text })}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Enter admin email"
                    value={newGroup.admin_email}
                    onChangeText={(text) => setNewGroup({ ...newGroup, admin_email: text })}
                    keyboardType="email-address"
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddGroup}>
                    <Text style={styles.addButtonText}>Add Group</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={groups}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderGroupItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No groups found.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    header: {
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: "#0057D8",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
    },
    formContainer: {
        backgroundColor: "#fff",
        margin: 10,
        padding: 15,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    input: {
        height: 50,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
        fontSize: 16,
        backgroundColor: "#fff",
    },
    addButton: {
        padding: 10,
        backgroundColor: "#0057D8",
        borderRadius: 5,
        alignItems: "center",
    },
    addButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    groupCard: {
        backgroundColor: "#fff",
        margin: 10,
        borderRadius: 10,
        padding: 15,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    groupName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    groupAdmin: {
        fontSize: 14,
        color: "#666",
        marginTop: 5,
    },
    memberDetails: {
        marginTop: 10,
        padding: 10,
        backgroundColor: "#f9f9f9",
        borderRadius: 5,
    },
    memberCount: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#333",
    },
    memberEmail: {
        fontSize: 14,
        color: "#555",
        marginTop: 5,
    },
    removeButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: "#DC3545",
        borderRadius: 5,
        alignItems: "center",
    },
    removeButtonText: {
        color: "#fff",
        fontSize: 16,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#333",
    },
    errorText: {
        fontSize: 16,
        color: "red",
        textAlign: "center",
        marginBottom: 20,
    },
    retryButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: "#ff9900",
        borderRadius: 5,
        alignItems: "center",
    },
    retryButtonText: {
        color: "#fff",
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        color: "#333",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: {
        paddingBottom: 20,
    },
});