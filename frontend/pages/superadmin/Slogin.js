import { useContext, useState } from 'react';
import { urlContext } from "../../urlContext";
import { Text, View, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

export default function Slogin() {
    const navigation = useNavigation();
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
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        try {
            console.log(`Attempting login with URL: ${url}/slogin`);
            const res = await axios.post(`${url}/slogin`, user, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log('Login response:', res.data);
            Alert.alert(res.data.message);
            if (res.data.message === "Login successful") {
                navigation.navigate("sdash");
            }
        } catch (error) {
            console.error('Login error:', {
                message: error.message,
                code: error.code,
                url: error.config?.url,
                response: error.response?.data || 'No response',
            });
            if (error.code === 'ECONNABORTED') {
                Alert.alert('Error', 'Request timed out. Please check your internet or server.');
            } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                Alert.alert('Error', 'Server not found. Ensure the server is running.');
            } else if (error.response) {
                Alert.alert('Error', error.response.data.message || 'Login failed.');
            } else {
                Alert.alert('Error', 'Network error. Please try again.');
            }
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Super Admin Login</Text>
            <View style={styles.inputContainer}>
                <TextInput 
                    value={user.email} 
                    onChangeText={(value) => onChange('email', value)} 
                    placeholder="Email Address" 
                    style={styles.input}
                    keyboardType="email-address" 
                    placeholderTextColor="#A3A3A3"
                />
                <TextInput 
                    value={user.password} 
                    onChangeText={(value) => onChange('password', value)} 
                    placeholder="Password" 
                    style={styles.input} 
                    secureTextEntry={true}
                    placeholderTextColor="#A3A3A3"
                />
                <TouchableOpacity style={styles.loginButton} onPress={handlePress}>
                    <Text style={styles.buttonText}>Sign In</Text>
                </TouchableOpacity>

                {/* Register Button */}
                <TouchableOpacity 
                    style={styles.registerButton} 
                    onPress={() => navigation.navigate("sregister")}
                >
                    <Text style={styles.registerText}>Register as Super Admin</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate("userregister")}>
                    <Text style={styles.userText}>Sign in as User</Text>
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
        backgroundColor: '#F7F8FA', // Light gray-blue for a clean, professional backdrop
    },
    title: {
        fontSize: 26,
        fontWeight: '600',         // Semi-bold for a professional tone
        color: '#1F2A44',          // Dark navy for authority
        marginBottom: 35,
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
        maxWidth: 380,             // Compact width for a focused layout
        paddingHorizontal: 20,
        paddingVertical: 25,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,          // Subtle rounding for softness
        borderWidth: 1,
        borderColor: '#E8ECEF',    // Light border for definition
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,       // Very subtle shadow for elevation
        shadowRadius: 4,
        elevation: 3,              // Minimal elevation for depth
    },
    input: {
        width: '100%',
        height: 48,                // Standard height for professional forms
        borderColor: '#D1D5DB',    // Light gray border
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 15,
        paddingLeft: 15,
        fontSize: 16,
        color: '#1F2A44',          // Dark text for readability
        backgroundColor: '#FFFFFF',
    },
    loginButton: {
        backgroundColor: '#0057D8', // Professional blue for trust
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',         // Medium weight for clarity
        letterSpacing: 0.2,
    },
    registerButton: {
        marginTop: 10,
        alignItems: 'center',
    },
    registerText: {
        color: '#0057D8',          // Matching blue for consistency
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    userText: {
        marginTop: 10,
        color: '#6B7280',          // Muted gray for secondary action
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'center',
        textDecorationLine: 'underline',
    },
});