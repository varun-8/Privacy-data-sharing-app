import { useState, useEffect, useContext } from "react";
import { Text, TouchableOpacity, View, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { urlContext } from "../../urlContext";

export default function Sdash() {
    const navigation = useNavigation();
    const { url } = useContext(urlContext);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [failedLogins, setFailedLogins] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingFailedLogins, setLoadingFailedLogins] = useState(true);
    const [errorStats, setErrorStats] = useState(null);
    const [errorFailedLogins, setErrorFailedLogins] = useState(null);

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

    // Fetch failed login attempts
    const fetchFailedLogins = async () => {
        try {
            const res = await axios.get(`${url}/failed-logins`, { timeout: 5000 });
            setFailedLogins(res.data.failed_logins || []);
        } catch (err) {
            setErrorFailedLogins("Failed to load failed login attempts.");
        } finally {
            setLoadingFailedLogins(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchStats();
        fetchFailedLogins();

        // Polling every 10 seconds
        const interval = setInterval(() => {
            fetchFailedLogins();
        }, 10000); // 10 seconds

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, []);

    const handleRequestsPress = () => {
        navigation.navigate('viewrequests');
    };

    const handleUsersPress = () => {
        navigation.navigate('manageusers');
    };

    const handleGroupsPress = () => {
        navigation.navigate('managegroups');
    };

    const handleSettingsPress = () => {
        navigation.navigate('settings');
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Super Admin Dashboard</Text>

            {/* Stats Section */}
            <View style={styles.statsCard}>
                {loadingStats ? (
                    <Text style={styles.statsText}>Loading stats...</Text>
                ) : errorStats ? (
                    <Text style={styles.errorText}>{errorStats}</Text>
                ) : (
                    <>
                        <Text style={styles.statsText}>Pending Requests: {stats.pending}</Text>
                        <Text style={styles.statsText}>Approved: {stats.approved}</Text>
                        <Text style={styles.statsText}>Rejected: {stats.rejected}</Text>
                    </>
                )}
            </View>

            {/* Failed Login Attempts Section */}
            <View style={styles.failedLoginsCard}>
                <Text style={styles.sectionTitle}>Failed Login Attempts</Text>
                {loadingFailedLogins ? (
                    <Text style={styles.statsText}>Loading failed logins...</Text>
                ) : errorFailedLogins ? (
                    <Text style={styles.errorText}>{errorFailedLogins}</Text>
                ) : failedLogins.length === 0 ? (
                    <Text style={styles.statsText}>No failed login attempts.</Text>
                ) : (
                    failedLogins.map((attempt, index) => (
                        <View key={index} style={styles.attemptItem}>
                            <Text style={styles.attemptText}>Username: {attempt.username}</Text>
                            <Text style={styles.attemptText}>Attempts: {attempt.attempts}</Text>
                            <Text style={styles.attemptText}>IP: {attempt.ip_address}</Text>
                            <Text style={styles.attemptText}>Last Attempt: {new Date(attempt.last_attempt).toLocaleString()}</Text>
                        </View>
                    ))
                )}
            </View>

            {/* Buttons */}
            <TouchableOpacity style={styles.button} onPress={handleRequestsPress}>
                <Text style={styles.buttonText}>View Requests</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleUsersPress}>
                <Text style={styles.buttonText}>Manage Users</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleGroupsPress}>
                <Text style={styles.buttonText}>Manage Groups</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleSettingsPress}>
                <Text style={styles.buttonText}>Settings</Text>
            </TouchableOpacity>

            {/* Compliance Section */}
            <View style={styles.complianceContainer}>
                <Text style={styles.complianceText}>Compliance Status: </Text>
                <View style={styles.statusIndicator} />
                <Text style={styles.complianceText}>GDPR Compliant</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 30,
        backgroundColor: '#F7F9FC',
    },
    title: {
        fontSize: 26,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 40,
        color: '#1A3552',
        letterSpacing: 0.5,
    },
    statsCard: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 10,
        marginBottom: 30,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        width: '100%',
        alignItems: 'center',
    },
    failedLoginsCard: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 10,
        marginBottom: 30,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        width: '100%',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A3552',
        marginBottom: 10,
        textAlign: 'center',
    },
    statsText: {
        fontSize: 14,
        color: '#1A3552',
        marginVertical: 5,
    },
    errorText: {
        fontSize: 14,
        color: '#DC3545',
        marginVertical: 5,
    },
    attemptItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingVertical: 10,
    },
    attemptText: {
        fontSize: 14,
        color: '#1A3552',
    },
    button: {
        backgroundColor: '#2A5D8F',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginVertical: 10,
        width: '60%',
        alignSelf: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    complianceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 30,
        justifyContent: 'center',
    },
    complianceText: {
        fontSize: 14,
        color: '#1A3552',
    },
    statusIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#28A745',
        marginHorizontal: 5,
    },
});