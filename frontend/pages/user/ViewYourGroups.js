import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";

export default function ViewYourGroups() {
    const { url } = useContext(urlContext);  
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

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Groups</Text>
            {data.length === 0 ? (
                <Text>No groups found.</Text>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.id.toString()}  
                    renderItem={({ item }) => (
                        <View style={styles.row}>
                            <Text style={styles.cell}>{item.name}</Text>
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
        backgroundColor: '#fff',
    },

    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
        textAlign: 'center',
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },

    cell: {
        fontSize: 16,
        flex: 1,
        textAlign: 'left',
        color: '#333',
    },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
