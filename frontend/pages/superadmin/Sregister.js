import { useState, useContext } from 'react';
import {
    TextInput,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import axios from 'axios';
import { urlContext } from '../../urlContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function Sregister() {
    const navigation = useNavigation();
    const { url } = useContext(urlContext);
    const [user, setUser] = useState({ name: '', password: '', email: '' });
    const [errors, setErrors] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Input change handler with validation
    const handleInputChange = (field, value) => {
        setUser({ ...user, [field]: value });

        if (field === 'name') {
            setErrors({ ...errors, name: value.length >= 2 || value === '' ? '' : 'Name must be at least 2 characters' });
        } else if (field === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            setErrors({ ...errors, email: emailRegex.test(value) || value === '' ? '' : 'Invalid email format' });
        } else if (field === 'password') {
            setErrors({ ...errors, password: value.length >= 6 || value === '' ? '' : 'Password must be at least 6 characters' });
        }
    };

    // Submit handler with enhanced error handling
    const handleSubmit = async () => {
        if (!user.name || !user.email || !user.password) {
            Alert.alert('Error', 'All fields are required!');
            return;
        }
        if (errors.name || errors.email || errors.password) {
            Alert.alert('Error', 'Please fix the errors in the form.');
            return;
        }

        setLoading(true);
        try {
            console.log(`Registering with URL: ${url}/superregister`);
            const res = await axios.post(`${url}/superregister`, user, {
                timeout: 5000,
                headers: { 'Content-Type': 'application/json' },
            });
            console.log('Register response:', res.data);
            Alert.alert('Success', res.data.message, [
                { text: 'OK', onPress: () => navigation.navigate('slogin') },
            ]);
        } catch (error) {
            console.error('Register error:', {
                message: error.message,
                code: error.code,
                url: error.config?.url,
                response: error.response?.data || 'No response',
            });
            let errorMessage = 'Registration failed. Please try again.';
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timed out. Check your internet or server.';
            } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                errorMessage = 'Server not found. Ensure the server is running.';
            } else if (error.response) {
                errorMessage = error.response.data.message || 'Server error.';
            }
            Alert.alert('Error', errorMessage, [
                { text: 'Retry', onPress: () => handleSubmit() },
                { text: 'OK' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Super Admin Registration</Text>
            <View style={styles.formContainer}>
                {/* Name Input */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        value={user.name}
                        onChangeText={(text) => handleInputChange('name', text)}
                        placeholder="Enter Name"
                        style={[styles.input, errors.name ? styles.inputError : null]}
                        placeholderTextColor="#A3A3A3"
                    />
                    {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
                </View>

                {/* Email Input */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        value={user.email}
                        onChangeText={(text) => handleInputChange('email', text)}
                        placeholder="Enter Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={[styles.input, errors.email ? styles.inputError : null]}
                        placeholderTextColor="#A3A3A3"
                    />
                    {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                </View>

                {/* Password Input with Toggle */}
                <View style={styles.inputWrapper}>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            value={user.password}
                            onChangeText={(text) => handleInputChange('password', text)}
                            placeholder="Enter Password"
                            secureTextEntry={!showPassword}
                            style={[styles.input, errors.password ? styles.inputError : null]}
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

                {/* Register Button */}
                <TouchableOpacity
                    style={[styles.registerButton, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>Register</Text>
                    )}
                </TouchableOpacity>

                {/* Back to Login Link */}
                <TouchableOpacity onPress={() => navigation.navigate('slogin')}>
                    <Text style={styles.loginText}>Already have an account? Sign in</Text>
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
        padding: 25,
        backgroundColor: '#F9FAFB', // Soft gray background
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1E40AF', // Modern blue
        marginBottom: 40,
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
        maxWidth: 400,
        padding: 25,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E8ECEF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
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
        backgroundColor: '#F9FAFB',
    },
    inputError: {
        borderColor: '#EF4444', // Red border for errors
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
        color: '#EF4444',
        fontSize: 12,
        marginTop: 5,
        fontWeight: '400',
    },
    registerButton: {
        backgroundColor: '#1E40AF', // Matching blue
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#1E40AF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    buttonDisabled: {
        backgroundColor: '#93C5FD', // Lighter blue when disabled
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    loginText: {
        color: '#1E40AF',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        textDecorationLine: 'underline',
    },
});