import { useState, useEffect, useContext } from "react";
import { Text, View, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import axios from "axios";
import { urlContext } from "../../urlContext";

export default function ManageUsers() {
    const { url } = useContext(urlContext);
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ email: "", role: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get(`${url}/users`, { timeout: 5000 });
            setUsers(res.data.users || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load users.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async () => {
        if (!newUser.email || !newUser.role) {
            Alert.alert("Error", "Please enter both email and role.");
            return;
        }
        try {
            const res = await axios.post(`${url}/add-user`, newUser, {
                timeout: 5000,
                headers: { "Content-Type": "application/json" },
            });
            Alert.alert("Success", res.data.message);
            setNewUser({ email: "", role: "" });
            fetchUsers();
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Failed to add user.");
        }
    };

    const handleRemoveUser = (userId, userEmail) => {
        Alert.alert(
            "Confirm Removal",
            `Are you sure you want to remove ${userEmail}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const res = await axios.delete(`${url}/remove-user/${userId}`, { timeout: 5000 });
                            Alert.alert("Success", res.data.message);
                            fetchUsers();
                        } catch (err) {
                            Alert.alert("Error", err.response?.data?.message || "Failed to remove user.");
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <Text style={styles.loadingText}>Loading users...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
                    <Text style={styles.buttonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Manage Users</Text>
            <View style={styles.formContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter email"
                    value={newUser.email}
                    onChangeText={(text) => setNewUser({ ...newUser, email: text })}
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Enter role (e.g., admin, user)"
                    value={newUser.role}
                    onChangeText={(text) => setNewUser({ ...newUser, role: text })}
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddUser}>
                    <Text style={styles.buttonText}>Add User</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={users}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.userRow}>
                        <Text style={styles.userText}>{item.email}</Text>
                        <Text style={styles.userText}>{item.role}</Text>
                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => handleRemoveUser(item.id, item.email)}
                        >
                            <Text style={styles.buttonText}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.noDataText}>No users found.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        padding: 20, 
        backgroundColor: '#F7F9FC' 
    },
    title: { 
        fontSize: 26, 
        fontWeight: '600', 
        textAlign: 'center', 
        marginBottom: 20, 
        color: '#1A3552', 
        letterSpacing: 0.5 
    },
    formContainer: { 
        backgroundColor: '#FFFFFF', 
        padding: 15, 
        borderRadius: 10, 
        marginBottom: 20, 
        elevation: 2, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 4 
    },
    input: { 
        width: '100%', 
        height: 50, 
        borderColor: '#D1D5DB', 
        borderWidth: 1, 
        borderRadius: 8, 
        marginBottom: 15, 
        paddingLeft: 15, 
        fontSize: 16, 
        color: '#1A3552' 
    },
    addButton: { 
        backgroundColor: '#28A745', 
        paddingVertical: 12, 
        borderRadius: 10, 
        alignItems: 'center' 
    },
    userRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: '#FFFFFF', 
        padding: 15, 
        borderRadius: 8, 
        marginBottom: 10, 
        elevation: 2, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 4 
    },
    userText: { 
        fontSize: 14, 
        color: '#1A3552', 
        flex: 1 
    },
    removeButton: { 
        backgroundColor: '#DC3545', 
        paddingVertical: 8, 
        paddingHorizontal: 15, 
        borderRadius: 6 
    },
    buttonText: { 
        color: '#FFFFFF', 
        fontSize: 14, 
        fontWeight: '500', 
        textAlign: 'center' 
    },
    center: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    loadingText: { 
        fontSize: 16, 
        color: '#2A5D8F' 
    },
    errorText: { 
        fontSize: 16, 
        color: '#DC3545',
        marginBottom: 20 
    },
    retryButton: { 
        backgroundColor: '#2A5D8F', 
        paddingVertical: 10, 
        paddingHorizontal: 20, 
        borderRadius: 8 
    },
    noDataText: { 
        fontSize: 16, 
        color: '#1A3552', 
        textAlign: 'center', 
        marginTop: 20 
    },
}); 