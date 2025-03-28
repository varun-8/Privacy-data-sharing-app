import { useContext, useState } from 'react';
import { urlContext } from "../../urlContext";
import { Text, View, TextInput, Alert, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function Slogin() {
    const navigation = useNavigation();
    const { url } = useContext(urlContext);
    const [user, setUser] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Input change handler with validation
    const onChange = (name, value) => {
        setUser({ ...user, [name]: value });
        if (name === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            setErrors({ ...errors, email: emailRegex.test(value) || value === '' ? '' : 'Invalid email format' });
        } else if (name === 'password') {
            setErrors({ ...errors, password: value.length >= 6 || value === '' ? '' : 'Password must be at least 6 characters' });
        }
    };

    // Login handler
    const handlePress = async () => {
        if (!user.email || !user.password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }
        if (errors.email || errors.password) {
            Alert.alert('Error', 'Please fix the errors in the form.');
            return;
        }

        setLoading(true);
        try {
            console.log(`Attempting login with URL: ${url}/slogin`);
            const res = await axios.post(`${url}/slogin`, user, {
                timeout: 5000,
                headers: { 'Content-Type': 'application/json' },
            });
            console.log('Login response:', res.data);
            Alert.alert('Success', res.data.message);
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
            let errorMessage = 'Login failed. Please try again.';
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timed out. Check your internet or server.';
            } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                errorMessage = 'Server not found. Ensure the server is running.';
            } else if (error.response) {
                errorMessage = error.response.data.message || 'Invalid credentials.';
            }
            Alert.alert('Error', errorMessage, [
                { text: 'Retry', onPress: () => handlePress() },
                { text: 'OK' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Super Admin Login</Text>
            <View style={styles.inputContainer}>
                {/* Email Input */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        value={user.email}
                        onChangeText={(value) => onChange('email', value)}
                        placeholder="Email Address"
                        style={[styles.input, errors.email ? styles.inputError : null]}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#A3A3A3"
                    />
                    {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                </View>

                {/* Password Input with Toggle */}
                <View style={styles.inputWrapper}>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            value={user.password}
                            onChangeText={(value) => onChange('password', value)}
                            placeholder="Password"
                            style={[styles.input, errors.password ? styles.inputError : null]}
                            secureTextEntry={!showPassword}
                            placeholderTextColor="#A3A3A3"
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={showPassword ? 'eye-off' : 'eye'}
                                size={20}
                                color="#6B7280"
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                </View>

                {/* Forgot Password Link */}
                <TouchableOpacity style={styles.forgotPassword} onPress={() => Alert.alert('Info', 'Forgot Password feature coming soon!')}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                    style={[styles.loginButton, loading && styles.buttonDisabled]}
                    onPress={handlePress}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>Sign In</Text>
                    )}
                </TouchableOpacity>

                {/* Register Button */}
               

                {/* User Login Link */}
                <TouchableOpacity onPress={() => navigation.navigate("userregister")}>
                    <Text style={styles.userText}>Create a new account</Text>
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
        backgroundColor: '#F7F8FA', // Light gray-blue background
    },
    title: {
        fontSize: 28,
        fontWeight: '700', // Bold for emphasis
        color: '#1F2A44', // Dark navy
        marginBottom: 40,
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
        maxWidth: 400, // Slightly wider for better readability
        padding: 25,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E8ECEF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5, // Slightly higher for a modern lift
    },
    inputWrapper: {
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#D1D5DB',
        borderWidth: 1,
        borderRadius: 10,
        paddingLeft: 15,
        paddingRight: 40, // Space for eye icon
        fontSize: 16,
        color: '#1F2A44',
        backgroundColor: '#F9FAFB', // Subtle off-white for inputs
    },
    inputError: {
        borderColor: '#DC3545', // Red border for errors
    },
    passwordContainer: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
    },
    eyeIcon: {
        position: 'absolute',
        right: 15,
        top: '50%',
        transform: [{ translateY: -10 }],
    },
    errorText: {
        color: '#DC3545',
        fontSize: 12,
        marginTop: 5,
        fontWeight: '400',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotText: {
        color: '#0057D8',
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    loginButton: {
        backgroundColor: '#0057D8', // Professional blue
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#0057D8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    buttonDisabled: {
        backgroundColor: '#A3BFFA', // Lighter blue when disabled
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600', // Slightly bolder
        letterSpacing: 0.5,
    },
    registerButton: {
        alignItems: 'center',
        marginBottom: 15,
    },
    registerText: {
        color: '#0057D8',
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    userText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'center',
        textDecorationLine: 'underline',
    },
});