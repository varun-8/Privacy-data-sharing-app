import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    StyleSheet,
} from "react-native";
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";
import { Ionicons } from '@expo/vector-icons';

export default function ViewUserRequests() {
    const { url } = useContext(urlContext);
    const { cuser } = useContext(userContext);

    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [canceling, setCanceling] = useState({}); // Track canceling state

    // Fetch join requests
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${url}/getuserrequests/${cuser}`, { timeout: 5000 });
            console.log("Response from backend:", res.data);
            const requests = res.data.requests_with_groupnames || [];
            setData(requests);
            setFilteredData(requests);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching user requests:", {
                message: err.message,
                code: err.code,
                response: err.response?.data,
            });
            let errorMessage = "Failed to fetch join requests.";
            if (err.code === 'ECONNABORTED') errorMessage = "Request timed out. Check your connection.";
            else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') errorMessage = "Server unreachable.";
            else if (err.response) errorMessage = err.response.data.message || "Server error.";
            setError(errorMessage);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [cuser]);

    // Filter requests by group name
    const filterRequests = (query) => {
        setSearchQuery(query);
        if (!query) {
            setFilteredData(data);
        } else {
            const filtered = data.filter(request =>
                request.gname.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredData(filtered);
        }
    };

    // Cancel a join request
    const handleCancel = async (requestId) => {
        setCanceling(prev => ({ ...prev, [requestId]: true }));
        try {
            const res = await axios.post(`${url}/cancelrequest`, { user: cuser, requestId });
            console.log("Cancel response:", res.data);
            setData(prev => prev.filter(req => req._id !== requestId));
            setFilteredData(prev => prev.filter(req => req._id !== requestId));
            alert("Request canceled successfully.");
        } catch (err) {
            console.error("Error canceling request:", err);
            const errorMsg = err.response?.data?.message || "Failed to cancel request.";
            alert(errorMsg);
        } finally {
            setCanceling(prev => ({ ...prev, [requestId]: false }));
        }
    };

    // Render request item
    const renderRequestItem = ({ item }) => {
        const statusColor = {
            accepted: '#10B981', // Green
            pending: '#F59E0B', // Orange
            rejected: '#EF4444', // Red
        }[item.status.toLowerCase()] || '#6B7280'; // Gray for unknown

        return (
            <View style={styles.requestCard}>
                <View style={styles.requestInfo}>
                    <Text style={styles.groupName}>{item.gname}</Text>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        Status: {item.status}
                    </Text>
                </View>
                {item.status.toLowerCase() === 'pending' && (
                    <TouchableOpacity
                        style={[styles.cancelButton, canceling[item._id] && styles.cancelButtonDisabled]}
                        onPress={() => handleCancel(item._id)}
                        disabled={canceling[item._id]}
                    >
                        {canceling[item._id] ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.cancelButtonText}>Cancel Request</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
          
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by group name..."
                    value={searchQuery}
                    onChangeText={filterRequests}
                    placeholderTextColor="#9CA3AF"
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1E40AF" />
                    <Text style={styles.loadingText}>Loading your requests...</Text>
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
                    <Ionicons name="lock-closed-outline" size={50} color="#6B7280" />
                    <Text style={styles.emptyText}>No join requests found.</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item._id || item.requestId || Math.random().toString()}
                    renderItem={renderRequestItem}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Light gray for a clean, secure feel
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: '#1E40AF', // Deep blue for privacy
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
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    requestCard: {
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
    requestInfo: {
        flex: 1,
        marginRight: 15,
    },
    groupName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2A44',
        marginBottom: 5,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
    },
    cancelButton: {
        backgroundColor: '#EF4444', // Red for cancel action
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    cancelButtonDisabled: {
        backgroundColor: '#FCA5A5', // Lighter red when disabled
        opacity: 0.7,
    },
    cancelButtonText: {
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