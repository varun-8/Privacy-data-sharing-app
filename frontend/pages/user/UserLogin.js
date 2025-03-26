import React, { useContext, useState, useEffect } from 'react';
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";
import { Text, View, TextInput, Alert, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function UserLogin() {
    const navigation = useNavigation();
    const { cuser, setCuser } = useContext(userContext);
    const { url } = useContext(urlContext);
    const [user, setUser] = useState({
        email: '',
        password: ''
    });
    const [fadeAnim] = useState(new Animated.Value(0));
    const [showPassword, setShowPassword] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const MAX_ATTEMPTS = 5;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    useFocusEffect(
        React.useCallback(() => {
            return () => {
                setUser({ email: '', password: '' });
                setLoginAttempts(0);
            };
        }, [])
    );

    const onChange = (name, value) => {
        setUser({ ...user, [name]: value });
    };

    const validateInputs = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user.email)) {
            Alert.alert("Error", "Please enter a valid email address.");
            return false;
        }
        if (user.password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters long.");
            return false;
        }
        return true;
    };

    const handlePress = async () => {
        if (!user.email || !user.password) {
            Alert.alert("Error", "Please enter both email and password.");
            return;
        }

        if (!validateInputs()) return;

        if (loginAttempts >= MAX_ATTEMPTS) {
            Alert.alert("Error", "Too many failed attempts. Please wait 30 seconds.");
            setTimeout(() => setLoginAttempts(0), 30000);
            return;
        }

        try {
            const res = await axios.post(`${url}/userlogin`, user);
            Alert.alert('Success', res.data.message);
            if (res.data.message === "Login successful") {
                setCuser(user.email);
                navigation.navigate("userdash");
            }
        } catch (error) {
            setLoginAttempts(prev => prev + 1);
            Alert.alert("Error", error.response?.data?.message || "Login failed. Please try again.");
        }
    };

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>
                
                <View style={styles.inputContainer}>
                    <TextInput
                        value={user.email}
                        onChangeText={(value) => onChange('email', value)}
                        placeholder="Email Address"
                        style={styles.input}
                        keyboardType="email-address"
                        placeholderTextColor="#A1A1AA"
                        autoCapitalize="none"
                    />
                    <View style={styles.passwordContainer}>
                        <TextInput
                            value={user.password}
                            onChangeText={(value) => onChange('password', value)}
                            placeholder="Password"
                            style={styles.passwordInput}
                            secureTextEntry={!showPassword}
                            placeholderTextColor="#A1A1AA"
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={showPassword ? "eye-off" : "eye"}
                                size={20}
                                color="#6B7280"
                            />
                        </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity style={styles.loginButton} onPress={handlePress}>
                        <Text style={styles.loginButtonText}>Sign In</Text>
                    </TouchableOpacity>

                    <View style={styles.linksContainer}>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate("userregister")} 
                            style={styles.linkButton}
                        >
                            <Text style={styles.linkText}>Create Account</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate("slogin")} 
                            style={styles.linkButton}
                        >
                            <Text style={styles.linkText}>Administrator Access</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.footerText}>© 2025 Data Sharing App. All rights reserved.</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F9FC',
    },
    formContainer: {
        width: '90%',
        maxWidth: 400,
        padding: 30,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        marginBottom: 25,
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#E2E8F0',
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 15,
        paddingHorizontal: 15,
        fontSize: 16,
        backgroundColor: '#F8FAFC',
    },
    passwordContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    passwordInput: {
        width: '100%',
        height: 50,
        borderColor: '#E2E8F0',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingRight: 45,
        fontSize: 16,
        backgroundColor: '#F8FAFC',
    },
    eyeButton: {
        position: 'absolute',
        right: 15,
        top: '50%',
        transform: [{ translateY: -10 }],
    },
    loginButton: {
        backgroundColor: '#2563EB',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    linksContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    linkButton: {
        padding: 5,
    },
    linkText: {
        color: '#2563EB',
        fontSize: 14,
        fontWeight: '500',
    },
    footerText: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 10,
    },
});