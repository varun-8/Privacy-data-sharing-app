import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";
import {
    FlatList,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
} from "react-native";
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ViewAllGroups() {
    const { url } = useContext(urlContext);
    const { cuser } = useContext(userContext);

    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('asc'); // asc or desc
    const [joining, setJoining] = useState({}); // Track join request loading state

    // Fetch groups
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${url}/getallgroups/${cuser}`, { timeout: 5000 });
            if (res.data.groups && Array.isArray(res.data.groups)) {
                setData(res.data.groups);
                setFilteredData(res.data.groups);
            } else {
                setError("No groups available to join.");
            }
            setLoading(false);
        } catch (err) {
            setError("Failed to fetch groups. Please check your connection or try again.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [cuser]);

    // Filter groups by search query
    const filterGroups = (query) => {
        setSearchQuery(query);
        if (!query) {
            setFilteredData(data);
        } else {
            const filtered = data.filter(group =>
                group.name.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredData(filtered);
        }
    };

    // Sort groups by member count
    const sortGroups = () => {
        const sorted = [...filteredData].sort((a, b) => {
            const countA = a.members?.length || 0;
            const countB = b.members?.length || 0;
            return sortOrder === 'asc' ? countA - countB : countB - countA;
        });
        setFilteredData(sorted);
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    // Handle join request
    const handleJoin = async (groupId) => {
        setJoining(prev => ({ ...prev, [groupId]: true }));
        try {
            const res = await axios.get(`${url}/joinrequest/${cuser}/${groupId}`);
            Alert.alert("Success", res.data.message);
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Failed to send join request.";
            Alert.alert("Error", errorMsg);
        } finally {
            setJoining(prev => ({ ...prev, [groupId]: false }));
        }
    };

    // Render group item
    const renderGroupItem = ({ item }) => (
        <View style={styles.groupCard}>
            <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupMeta}>
                    {item.members?.length || 0} Members | Admin: {item.admin_name || 'N/A'}
                </Text>
            </View>
            <TouchableOpacity
                style={[styles.joinButton, joining[item._id] && styles.joinButtonDisabled]}
                onPress={() => handleJoin(item._id)}
                disabled={joining[item._id]}
            >
                {joining[item._id] ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                    <Text style={styles.joinButtonText}>Request to Join</Text>
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
         
              
            
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search groups by name..."
                    value={searchQuery}
                    onChangeText={filterGroups}
                    placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity style={styles.sortButton} onPress={sortGroups}>
                    <Ionicons
                        name={sortOrder === 'asc' ? "arrow-up" : "arrow-down"}
                        size={18}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1E40AF" />
                    <Text style={styles.loadingText}>Loading groups...</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Ionicons name="warning-outline" size={50} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : filteredData.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="albums-outline" size={50} color="#6B7280" />
                    <Text style={styles.emptyText}>No groups available to join.</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item._id.toString()}
                    renderItem={renderGroupItem}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Light gray for a clean look
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: '#1E40AF', // Deep blue for professionalism
        borderBottomWidth: 1,
        borderBottomColor: '#1E3A8A',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    refreshButton: {
        padding: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        margin: 15,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2A44',
        paddingVertical: 10,
    },
    sortButton: {
        backgroundColor: '#3B82F6',
        padding: 8,
        borderRadius: 8,
        marginLeft: 10,
        elevation: 2,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    groupCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 15,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    groupInfo: {
        flex: 1,
        marginRight: 15,
    },
    groupName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2A44',
        marginBottom: 5,
    },
    groupMeta: {
        fontSize: 14,
        color: '#6B7280',
    },
    joinButton: {
        backgroundColor: '#10B981', // Green for action
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    joinButtonDisabled: {
        backgroundColor: '#6EE7B7', // Lighter green when disabled
        opacity: 0.7,
    },
    joinButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '400',
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        textAlign: 'center',
        marginVertical: 20,
        paddingHorizontal: 20,
    },
    retryButton: {
        backgroundColor: '#1E40AF',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        shadowColor: '#1E40AF',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '400',
        marginTop: 15,
        textAlign: 'center',
    },
});