import React, { useState, useContext, useEffect } from "react";
import { Text, TouchableOpacity, TextInput, View, Alert, StyleSheet, Animated, ActivityIndicator, ScrollView } from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { userContext } from "../../userContext";
import { urlContext } from "../../urlContext";
import { Ionicons } from '@expo/vector-icons';

export default function UserDash() {
    const navigation = useNavigation();
    const { cuser, setCuser } = useContext(userContext);
    const { url } = useContext(urlContext);

    const [cgroup, setCGroup] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recentGroups, setRecentGroups] = useState([]);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [group, setGroup] = useState({
        name: '',
        description: '',
        email: cuser || '' // Default to empty string if cuser is null
    });

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        // Only fetch groups if cuser is available
        if (cuser) {
            fetchRecentGroups();
            setGroup((prev) => ({ ...prev, email: cuser }));
        }
    }, [fadeAnim, cuser]);

    const fetchRecentGroups = async () => {
        try {
            const res = await axios.get(`${url}/getmygroups/${cuser}`);
            if (res.data.groups && Array.isArray(res.data.groups)) {
                setRecentGroups(res.data.groups.slice(0, 3));
            } else {
                setRecentGroups([]);
            }
        } catch (e) {
            console.error('Error fetching recent groups:', e.response?.data || e.message);
            setRecentGroups([]);
        }
    };

    const handleCreateGroup = async () => {
        if (!group.name || !group.description) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await axios.post(`${url}/requestCreate`, group);
            Alert.alert('Success', res.data.message);
            setGroup({ name: '', description: '', email: cuser || '' });
            setCGroup(false);
            fetchRecentGroups();
        } catch (e) {
            console.error('Error creating group:', e.response?.data || e.message);
            Alert.alert('Error', 'Failed to create group.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickShare = () => {
        if (recentGroups.length > 0) {
            navigation.navigate('sharefiles', { name: recentGroups[0].name });
        } else {
            Alert.alert('No Groups', 'Create a group first to share files.');
        }
    };

    const handleLogout = () => {
        setCuser(null);
        navigation.navigate('userlogin');
    };

    // If cuser is null, redirect to login or show a loading state
    if (!cuser) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Please log in to continue...</Text>
                <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('userlogin')}>
                    <Text style={styles.loginButtonText}>Go to Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Animated.View style={{ opacity: fadeAnim }}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Data Privacy Hub</Text>
                    <Text style={styles.subtitle}>Welcome, {cuser}</Text>
                </View>

                {/* Profile Summary */}
                <View style={styles.profileCard}>
                    <Ionicons name="person-circle" size={50} color="#4F46E5" />
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{cuser.split('@')[0]}</Text>
                        <Text style={styles.profileEmail}>{cuser}</Text>
                    </View>
                </View>

                {/* Recent Groups */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Recent Groups</Text>
                    {recentGroups.length > 0 ? (
                        recentGroups.map((group) => (
                            <TouchableOpacity
                                key={group.id}
                                style={styles.groupCard}
                                onPress={() => navigation.navigate('seefiles', { gid: group.id })}
                            >
                                <Ionicons name="folder" size={24} color="#4F46E5" style={styles.groupIcon} />
                                <Text style={styles.groupName}>{group.name}</Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={styles.noDataText}>No groups yet. Create one below!</Text>
                    )}
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setCGroup(!cgroup)}
                    >
                        <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.actionText}>{cgroup ? "Cancel" : "New Group"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleQuickShare}
                    >
                        <Ionicons name="share" size={20} color="#FFFFFF" />
                        <Text style={styles.actionText}>Quick Share</Text>
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
                            placeholderTextColor="#9CA3AF"
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                            onPress={handleCreateGroup}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Create Group</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Navigation Buttons */}
                <View style={styles.navButtons}>
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => navigation.navigate('viewyourgroups')}
                    >
                        <Ionicons name="albums" size={20} color="#4F46E5" />
                        <Text style={styles.navButtonText}>My Groups</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => navigation.navigate('viewallgroups')}
                    >
                        <Ionicons name="earth" size={20} color="#4F46E5" />
                        <Text style={styles.navButtonText}>All Groups</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => navigation.navigate('viewuserrequests')}
                    >
                        <Ionicons name="mail" size={20} color="#4F46E5" />
                        <Text style={styles.navButtonText}>Requests</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => navigation.navigate('viewjoinrequests')}
                    >
                        <Ionicons name="person-add" size={20} color="#4F46E5" />
                        <Text style={styles.navButtonText}>Join Requests</Text>
                    </TouchableOpacity>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </Animated.View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingTop: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 20,
    },
    loginButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
        marginTop: 20,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#1F2937',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 5,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 15,
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    profileInfo: {
        marginLeft: 15,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    profileEmail: {
        fontSize: 14,
        color: '#6B7280',
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 10,
    },
    groupCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    groupIcon: {
        marginRight: 10,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
    },
    noDataText: {
        fontSize: 16,
        color: '#9CA3AF',
        textAlign: 'center',
        marginVertical: 20,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F46E5',
        paddingVertical: 12,
        borderRadius: 10,
        marginHorizontal: 5,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 5,
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#E5E7EB',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#F9FAFB',
        marginBottom: 15,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 15,
    },
    submitButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#9CA3AF',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    navButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 10,
        width: '48%',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    navButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#4F46E5',
        marginLeft: 10,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        marginTop: 20,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
        marginLeft: 5,
    },
});