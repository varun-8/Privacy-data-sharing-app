import { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Alert,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import axios from 'axios';
import { urlContext } from '../../urlContext';

export default function ViewRequests() {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null); // Track expanded item
    const { url } = useContext(urlContext);

    const fetchData = async () => {
        setLoading(true);
        const requestUrl = `${url}/getrequests`;
        try {
            const res = await axios.get(requestUrl, { timeout: 5000 });
            const requests = res.data.requests || res.data || [];
            const validRequests = requests.filter(
                (item) => item && item.gid && typeof item.gid === 'string'
            );
            setData(validRequests);
            setFilteredData(validRequests);
        } catch (err) {
            setError('Network Error: Unable to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (!query) {
            setFilteredData(data);
            return;
        }
        const lowerQuery = query.toLowerCase();
        const filtered = data.filter(
            (item) =>
                (item.name?.toLowerCase() || '').includes(lowerQuery) ||
                (item.description?.toLowerCase() || '').includes(lowerQuery) ||
                (item.user?.toLowerCase() || '').includes(lowerQuery) ||
                (item.status?.toLowerCase() || '').includes(lowerQuery)
        );
        setFilteredData(filtered);
    };

    const handleAllow = async (groupId, user) => {
        if (!groupId || typeof groupId !== 'string') {
            Alert.alert("Error", "Invalid Group ID");
            return;
        }
        try {
            const requestUrl = `${url}/allowrequests/${groupId}/${user}`;
            const res = await axios.post(requestUrl, {}, { timeout: 5000 });
            Alert.alert("Success", res.data.message);
            fetchData();
        } catch (error) {
            Alert.alert("Error", error.response?.data?.message || "Failed to allow request.");
        }
    };

    const handleDeny = async (groupId, user) => {
        if (!groupId || typeof groupId !== 'string') {
            Alert.alert("Error", "Invalid Group ID");
            return;
        }
        try {
            const requestUrl = `${url}/denyrequests/${groupId}/${user}`;
            const res = await axios.post(requestUrl, {}, { timeout: 5000 });
            Alert.alert("Denied", res.data.message);
            fetchData();
        } catch (error) {
            Alert.alert("Error", error.response?.data?.message || "Failed to deny request.");
        }
    };

    const toggleExpand = (gid) => {
        setExpandedId(expandedId === gid ? null : gid);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2A5D8F" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return styles.statusPending;
            case 'approved': return styles.statusApproved;
            case 'denied': return styles.statusDenied;
            default: return styles.statusDefault;
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            <TouchableOpacity onPress={() => toggleExpand(item.gid)} style={styles.groupHeader}>
                <Text style={styles.groupName}>{item.name || 'N/A'}</Text>
                <Text style={styles.expandIcon}>{expandedId === item.gid ? '−' : '+'}</Text>
            </TouchableOpacity>
            {expandedId === item.gid && (
                <View style={styles.detailsContainer}>
                    <Text style={styles.detailText}>Purpose: {item.description || 'N/A'}</Text>
                    <Text style={styles.detailText}>Admin: {item.user || 'N/A'}</Text>
                    <Text style={[styles.detailText, getStatusStyle(item.status)]}>
                        Status: {item.status || 'N/A'}
                    </Text>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.allowButton]}
                            onPress={() => handleAllow(item.gid, item.user)}
                        >
                            <Text style={styles.buttonText}>Allow</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.denyButton]}
                            onPress={() => handleDeny(item.gid, item.user)}
                        >
                            <Text style={styles.buttonText}>Deny</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Group Requests</Text>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search requests..."
                    placeholderTextColor="#A3BFFA"
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                <TouchableOpacity style={styles.refreshButton} onPress={fetchData}>
                    <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
            </View>
            {filteredData.length === 0 ? (
                <Text style={styles.noDataText}>
                    {searchQuery ? 'No matching requests found.' : 'No requests found.'}
                </Text>
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item.gid}
                    renderItem={renderItem}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#F7F9FC',
    },
    title: {
        fontSize: 26,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 15,
        color: '#1A3552',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        color: '#1A3552',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        elevation: 2,
    },
    refreshButton: {
        backgroundColor: '#2A5D8F',
        padding: 10,
        borderRadius: 8,
        marginLeft: 10,
    },
    refreshButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    itemContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
        overflow: 'hidden',
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#2A5D8F',
    },
    groupName: {
        fontSize: 18,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    expandIcon: {
        fontSize: 24,
        color: '#FFFFFF',
    },
    detailsContainer: {
        padding: 15,
    },
    detailText: {
        fontSize: 16,
        color: '#1A3552',
        marginBottom: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
    },
    allowButton: {
        backgroundColor: '#28A745',
    },
    denyButton: {
        backgroundColor: '#DC3545',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    statusPending: { color: '#FFC107', fontWeight: 'bold' },
    statusApproved: { color: '#28A745', fontWeight: 'bold' },
    statusDenied: { color: '#DC3545', fontWeight: 'bold' },
    statusDefault: { color: '#6C757D', fontWeight: 'bold' },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#2A5D8F',
        marginTop: 10,
    },
    errorText: {
        fontSize: 16,
        color: '#DC3545',
        textAlign: 'center',
    },
    noDataText: {
        fontSize: 16,
        color: '#1A3552',
        textAlign: 'center',
        marginTop: 20,
    },
});