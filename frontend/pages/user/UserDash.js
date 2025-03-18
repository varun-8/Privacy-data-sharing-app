import { useState } from "react";
import { Text, TouchableOpacity, TextInput, View, Button, Alert, StyleSheet } from "react-native";
import { useContext } from 'react';
import { userContext } from "../../userContext";
import { urlContext } from "../../urlContext";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

export default function UserDash() {
    const navigation = useNavigation();
    const { cuser } = useContext(userContext);
    const { url } = useContext(urlContext);

    const [cgroup, setCGroup] = useState(false);

    const [group, setGroup] = useState({
        name: '',
        description: '',
        email: cuser
    });

    const handleCreateGroup = async () => {
        if (!group.name || !group.description) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        try {
            const res = await axios.post(`${url}/requestCreate`, group);
            Alert.alert(res.data.message);
        } catch (e) {
            console.log(e);
        }
        setGroup({ name: '', description: '' });
        setCGroup(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>USER DASHBOARD</Text>
            <TouchableOpacity
                style={styles.createGroupButton}
                onPress={() => setCGroup(!cgroup)}
            >
                <Text style={styles.createGroupText}>Create New Group</Text>
            </TouchableOpacity>

            {cgroup && (
                <View style={styles.formContainer}>
                    <TextInput
                        placeholder="Group Name"
                        value={group.name}
                        onChangeText={(value) => setGroup({ ...group, name: value })}
                        style={styles.input}
                    />
                    <TextInput
                        placeholder="Group Description"
                        value={group.description}
                        onChangeText={(value) => setGroup({ ...group, description: value })}
                        style={styles.input}
                    />
                    <Button title="Create Group" onPress={handleCreateGroup} />
                </View>
            )}

            <Button
                title="View Your Groups"
                onPress={() => navigation.navigate('viewyourgroups')}
                color="#6200EE"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    createGroupButton: {
        backgroundColor: '#6200EE',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 20,
    },
    createGroupText: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
        maxWidth: 400,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 15,
        paddingLeft: 15,
        fontSize: 16,
    },
});
