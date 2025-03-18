import { useContext, useState } from 'react';
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";
import { Text, View, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

export default function UserLogin() {
    const navigation = useNavigation();
    const { cuser, setCuser } = useContext(userContext);
    const { url } = useContext(urlContext);
    const [user, setUser] = useState({
        email: '',
        password: ''
    });

    const onChange = (name, value) => {
        setUser({ ...user, [name]: value });
    };

    const handlePress = async () => {
        if (!user.email || !user.password) {
            Alert.alert("Error", "Please enter both email and password.");
            return;
        }

        try {
            const res = await axios.post(`${url}/userlogin`, user);
            Alert.alert(res.data.message);
            if (res.data.message === "Login successful") {
                setCuser(user.email);
                navigation.navigate("userdash");
            }
        } catch (error) {
            Alert.alert("Error", error.response?.data?.message || "Something went wrong.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>User Login</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    value={user.email}
                    onChangeText={(value) => onChange('email', value)}
                    placeholder="Enter email"
                    style={styles.input}
                    keyboardType="email-address"
                />
                <TextInput
                    value={user.password}
                    onChangeText={(value) => onChange('password', value)}
                    placeholder="Enter password"
                    style={styles.input}
                    secureTextEntry={true}
                />
                <Button onPress={handlePress} title='LOGIN' color="#6200EE" />

                <TouchableOpacity onPress={() => navigation.navigate("userregister")} style={styles.link}>
                    <Text style={styles.linkText}>I am new user</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        marginBottom: 30,
        color: '#333',
    },
    inputContainer: {
        width: '100%',
        maxWidth: 400,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
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
    link: {
        marginTop: 15,
        alignItems: 'center',
    },
    linkText: {
        color: '#6200EE',
        fontSize: 16,
        textDecorationLine: 'underline',
    },
});
