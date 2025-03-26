import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";

export default function Settings() {
    const navigation = useNavigation();
    const { url } = useContext(urlContext);
    const { cuser } = useContext(userContext);

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async () => {
        console.log("cuser:", cuser); // Debug line
        console.log("Payload:", {
            email: cuser,
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
        }); // Debug line
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            Alert.alert("Error", "All fields are required.");
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post(`${url}/change-superadmin-password`, {
                email: cuser,
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            Alert.alert("Success", res.data.message);
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Failed to change password.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle2FA = () => {
        setTwoFactorEnabled(!twoFactorEnabled);
        Alert.alert("Info", `2FA is now ${!twoFactorEnabled ? "enabled" : "disabled"} (mock feature).`);
    };

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Change Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Current Password"
                    secureTextEntry
                    value={passwordData.currentPassword}
                    onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                />
                <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    secureTextEntry
                    value={passwordData.newPassword}
                    onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    secureTextEntry
                    value={passwordData.confirmPassword}
                    onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                />
                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handlePasswordChange}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? "Changing..." : "Change Password"}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Security Settings</Text>
                <View style={styles.toggleContainer}>
                    <Text style={styles.toggleLabel}>Enable Two-Factor Authentication (2FA)</Text>
                    <TouchableOpacity
                        style={[styles.toggleButton, twoFactorEnabled && styles.toggleButtonActive]}
                        onPress={handleToggle2FA}
                    >
                        <Text style={styles.toggleText}>{twoFactorEnabled ? "ON" : "OFF"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#F7F9FC",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 30,
    },
    title: {
        fontSize: 26,
        fontWeight: "600",
        color: "#1A3552",
    },
    backButton: {
        padding: 5,
    },
    backText: {
        fontSize: 16,
        color: "#2A5D8F",
        fontWeight: "500",
    },
    section: {
        backgroundColor: "#FFFFFF",
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "500",
        color: "#1A3552",
        marginBottom: 10,
    },
    input: {
        width: "100%",
        height: 45,
        borderColor: "#D1D9E0",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 15,
        fontSize: 16,
        color: "#1A3552",
        backgroundColor: "#F9FAFB",
    },
    button: {
        backgroundColor: "#2A5D8F",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonDisabled: {
        backgroundColor: "#A3BFFA",
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "500",
    },
    toggleContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    toggleLabel: {
        fontSize: 16,
        color: "#1A3552",
    },
    toggleButton: {
        backgroundColor: "#D1D9E0",
        paddingVertical: 5,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    toggleButtonActive: {
        backgroundColor: "#28A745",
    },
    toggleText: {
        color: "#FFFFFF",
        fontWeight: "500",
    },
});