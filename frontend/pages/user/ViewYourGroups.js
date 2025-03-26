import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";
import { useNavigation } from '@react-navigation/native';

export default function ViewYourGroups() {
    const { url } = useContext(urlContext);  
    const navigation = useNavigation()
    const { cuser } = useContext(userContext);

    const [data, setData] = useState([]);  
    const [loading, setLoading] = useState(true);  
    const [error, setError] = useState(null); 

    const fetchData = async () => {
        try {
            const res = await axios.get(`${url}/getmygroups/${cuser}`);
            console.log("Backend Response:", res.data); 

            if (res.data.groups) {
                setData(res.data.groups);
            } else {
                setError("No groups found for this user");
            }
        } catch (err) {
            console.error(err);  
            setError('Error fetching groups. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();  
    }, []); 

    const renderGroupItem = ({ item }) => (
        <View style={styles.groupCard}>
            <Text style={styles.groupName}>{item.name}</Text>
            <TouchableOpacity style={styles.viewButton} onPress={()=>{navigation.navigate('seefiles', {gid: item.id })}}>
                <Text style={styles.viewButtonText} >Files</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewButton} onPress={()=>{navigation.navigate('sharefiles', {name: item.id })}}>
                <Text style={styles.viewButtonText} >share files</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0057D8" />
                <Text style={styles.loadingText}>Loading Your Groups...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Your Groups</Text>
            </View>
            {data.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No groups found.</Text>
                </View>
            ) : (
                <FlatList
                    data={data}
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
        backgroundColor: '#F7F8FA', // Light gray-blue for a professional backdrop
    },
    header: {
        paddingVertical: 20,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E4E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',         // Semi-bold for a professional tone
        color: '#1F2A44',          // Dark navy for authority
        textAlign: 'center',
    },
    listContent: {
        padding: 16,
    },
    groupCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E8ECEF',    // Subtle border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,              // Minimal elevation for depth
    },
    groupName: {
        fontSize: 16,
        fontWeight: '500',         // Medium weight for clarity
        color: '#1F2A44',          // Dark navy for readability
        flex: 1,
    },
    viewButton: {
        backgroundColor: '#0057D8', // Professional blue
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    viewButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F8FA',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6B7280',          // Muted gray
        fontWeight: '400',
    },
    errorText: {
        fontSize: 16,
        color: '#D14343',          // Professional red for errors
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#0057D8',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',          // Muted gray for neutrality
        fontWeight: '400',
    },
});