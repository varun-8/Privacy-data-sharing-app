import { useState, useContext, useEffect } from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { urlContext } from '../../urlContext';

export default function ViewRequests() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { url } = useContext(urlContext);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${url}/getrequests`);
            setData(res.data.requests);
        } catch (err) {
            setError('Error fetching data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Loading...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text>{error}</Text>
            </View>
        );
    }

    const handlePress = (gid, user) => {
        Alert.alert(
            'Request Action',
            `Do you want to allow the request with Group ID: ${gid}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Allow', 
                    onPress: async () => {
                        const dataToSend = {
                            gid: gid,
                            user: user
                        };

                        try {
                            const res = await axios.post(`${url}/allowrequests/${gid}/${user}`, dataToSend, {
                                headers: {
                                    'Content-Type': 'application/json',
                                }
                            });

                            Alert.alert(res.data.message);
                        } catch (error) {
                            Alert.alert('Error', 'An error occurred while processing the request.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Group Requests</Text>
            {data.length === 0 ? (
                <Text>No requests found.</Text>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.row}>
                            <Text style={styles.cell}>Group Name : {item.name}</Text>
                            <Text style={styles.cell}>Group Purpose : {item.description}</Text>
                            <Text style={styles.cell}>Admin : {item.user}</Text>
                            <Text style={styles.cell}>Status : {item.status}</Text>
                            <TouchableOpacity 
                                style={styles.button} 
                                onPress={() => handlePress(item.gid, item.user)}
                            >
                                <Text style={styles.buttonText}>Allow</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f4f4f4', 
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center', 
        color: '#333', 
    },
    row: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        backgroundColor: '#fff', 
        borderRadius: 8,
        elevation: 2, 
        paddingHorizontal: 12, 
    },
    cell: {
        fontSize: 16,
        flex: 1,
        color: '#333', 
        textAlign: 'left',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        width: 100, 
        marginLeft: 12, 
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold', 
    },
});
