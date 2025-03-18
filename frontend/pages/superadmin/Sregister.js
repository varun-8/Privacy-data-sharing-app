import { useState, useContext } from 'react';
import { TextInput, View, Text, StyleSheet, Button, Alert } from 'react-native';
import axios from 'axios';
import { urlContext } from '../../urlContext';

export default function Sregister() {
    const {url} = useContext(urlContext)
    const [user, setUser] = useState({
        name: '',
        password: '',
        email: ''
    });

    const handleInputChange = (field, value) => {
        setUser({
            ...user,
            [field]: value
        });
    };

    const handleSubmit = async () => {
        if (!user.name || !user.password || !user.email) {
            Alert.alert('Error', 'All fields are required!');
            return;
        }

        try {
            const res = await axios.post(`${url}/superregister`, user);

            if (res.status === 201) {
                Alert.alert('Success', res.data.message);  
            }

        } catch (error) {
            console.error(error);
            if (error.response) {
                Alert.alert('Error', error.response.data.message || 'Something went wrong.');
            } else {
                Alert.alert('Error', 'Network error. Please try again later.');
            }
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Super Admin Register</Text>
            
            <TextInput
                value={user.name}
                onChangeText={(text) => handleInputChange('name', text)}
                placeholder="Enter Name"
                style={styles.input}
            />
            <TextInput
                value={user.email}
                onChangeText={(text) => handleInputChange('email', text)}
                placeholder="Enter Email"
                keyboardType="email-address"
                style={styles.input}
            />
            <TextInput
                value={user.password}
                onChangeText={(text) => handleInputChange('password', text)}
                placeholder="Enter Password"
                secureTextEntry={true}
                style={styles.input}
            />

            <Button title="Register" onPress={handleSubmit} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f7f7f7',
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingLeft: 10,
        marginBottom: 15,
        backgroundColor: '#fff',
    },
});
