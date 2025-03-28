import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import axios from 'axios';
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function ViewYourGroups() {
    const { url } = useContext(urlContext);
    const { cuser } = useContext(userContext);
    const navigation = useNavigation();

    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [members, setMembers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [memberLoading, setMemberLoading] = useState({});
    const [memberError, setMemberError] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('asc'); // asc or desc

    // Fetch groups
    const fetchGroups = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log(`Fetching groups from: ${url}/getmygroups/${cuser}`);
            const res = await axios.get(`${url}/getmygroups/${cuser}`, { timeout: 5000 });
            console.log("Groups Response:", res.data);
            if (res.data.groups && Array.isArray(res.data.groups)) {
                setData(res.data.groups);
                setFilteredData(res.data.groups);
            } else {
                setError("No groups found for this user.");
            }
        } catch (err) {
            console.error("Error fetching groups:", {
                message: err.message,
                code: err.code,
                response: err.response?.data,
            });
            let errorMessage = 'Failed to fetch secure groups.';
            if (err.code === 'ECONNABORTED') errorMessage = 'Request timed out. Check your connection.';
            else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') errorMessage = 'Server unreachable.';
            else if (err.response) errorMessage = err.response.data.message || 'Server error.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Fetch group members
    const fetchMembers = async (gid) => {
        setMemberLoading(prev => ({ ...prev, [gid]: true }));
        setMemberError(prev => ({ ...prev, [gid]: null }));
        try {
            console.log(`Fetching members from: ${url}/groupmembers/${gid}`);
            const res = await axios.get(`${url}/groupmembers/${gid}`, { timeout: 5000 });
            console.log(`Members Response for ${gid}:`, res.data);
            if (res.data.members && Array.isArray(res.data.members)) {
                setMembers(prev => ({ ...prev, [gid]: res.data.members }));
            } else {
                setMemberError(prev => ({ ...prev, [gid]: "No members found in this group." }));
            }
        } catch (err) {
            console.error(`Error fetching members for ${gid}:`, {
                message: err.message,
                code: err.code,
                response: err.response?.data,
            });
            let errorMessage = 'Failed to fetch group members.';
            if (err.code === 'ECONNABORTED') errorMessage = 'Request timed out.';
            else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') errorMessage = 'Server unreachable.';
            else if (err.response) errorMessage = err.response.data.message || 'Server error.';
            setMemberError(prev => ({ ...prev, [gid]: errorMessage }));
        } finally {
            setMemberLoading(prev => ({ ...prev, [gid]: false }));
        }
    };

    useEffect(() => {
        fetchGroups();
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
            const countA = a.member_count || 0;
            const countB = b.member_count || 0;
            return sortOrder === 'asc' ? countA - countB : countB - countA;
        });
        setFilteredData(sorted);
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    // Toggle group expansion
    const toggleGroup = (gid) => {
        if (expandedGroup === gid) {
            setExpandedGroup(null);
        } else {
            setExpandedGroup(gid);
            if (!members[gid] && !memberLoading[gid] && !memberError[gid]) {
                fetchMembers(gid);
            }
        }
    };

    // Render group item
    const renderGroupItem = ({ item }) => {
        const isExpanded = expandedGroup === item.id;
        return (
            <View style={styles.groupCard}>
                <TouchableOpacity
                    style={styles.groupHeader}
                    onPress={() => toggleGroup(item.id)}
                >
                    <View style={styles.groupInfo}>
                        <Text style={styles.groupName}>{item.name}</Text>
                        <Text style={styles.groupMeta}>
                            {item.member_count !== undefined ? `${item.member_count} Members` : 'No members'}
                        </Text>
                    </View>
                    <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={24}
                        color="#1E40AF"
                    />
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.detailsContainer}>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => navigation.navigate('seefiles', { gid: item.id, name: item.name })}
                            >
                                <Ionicons name="document-lock-outline" size={18} color="#FFFFFF" />
                                <Text style={styles.buttonText}>View Files</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => navigation.navigate('sharefiles', { name: item.id })}
                            >
                                <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                                <Text style={styles.buttonText}>Share Files</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.chatButton}
                                onPress={() => navigation.navigate('groupchat', { gid: item.id, name: item.name })}
                            >
                                <Ionicons name="chatbubbles-outline" size={18} color="#FFFFFF" />
                                <Text style={styles.buttonText}>Chat</Text>
                            </TouchableOpacity>
                        </View>

                        {memberLoading[item.id] ? (
                            <ActivityIndicator size="small" color="#1E40AF" style={styles.memberLoading} />
                        ) : memberError[item.id] ? (
                            <View style={styles.memberError}>
                                <Text style={styles.errorText}>{memberError[item.id]}</Text>
                                <TouchableOpacity style={styles.retryButtonSmall} onPress={() => fetchMembers(item.id)}>
                                    <Text style={styles.retryButtonText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        ) : members[item.id] ? (
                            <View style={styles.memberList}>
                                <Text style={styles.memberTitle}>Authorized Members ({members[item.id].length}):</Text>
                                {members[item.id].map((member, index) => (
                                    <View key={index} style={styles.memberItem}>
                                        <Text style={styles.memberName}>{member.name}</Text>
                                        <Text style={styles.memberEmail}>{member.email}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : null}
                    </View>
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
                    placeholder="Search groups by name..."
                    value={searchQuery}
                    onChangeText={filterGroups}
                    placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity style={styles.sortButton} onPress={sortGroups}>
                    <Ionicons
                        name={sortOrder === 'asc' ? "arrow-up-outline" : "arrow-down-outline"}
                        size={20}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1E40AF" />
                    <Text style={styles.loadingText}>Loading secure groups...</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchGroups}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : filteredData.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="lock-closed-outline" size={50} color="#6B7280" />
                    <Text style={styles.emptyText}>No secure groups found.</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item.id.toString()}
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
        backgroundColor: '#F3F4F6',
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
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    groupCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    groupInfo: {
        flex: 1,
        marginRight: 15,
    },
    groupName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2A44',
        marginBottom: 4,
    },
    groupMeta: {
        fontSize: 14,
        color: '#6B7280',
    },
    detailsContainer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 15,
    },
    actionButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    chatButton: {
        backgroundColor: '#10B981', // Green for chat action
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 5,
    },
    memberList: {
        marginTop: 10,
    },
    memberTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2A44',
        marginBottom: 10,
    },
    memberItem: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    memberName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1F2A44',
    },
    memberEmail: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    memberLoading: {
        marginVertical: 10,
    },
    memberError: {
        alignItems: 'center',
        marginVertical: 10,
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
        marginBottom: 20,
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
    retryButtonSmall: {
        backgroundColor: '#3B82F6',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
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
    },
});