import React, { useContext, useState, useEffect } from 'react';
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";
import { Text, View, TextInput, Alert, StyleSheet, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function UserLogin() {
    const navigation = useNavigation();
    const { cuser, setCuser } = useContext(userContext);
    const { url } = useContext(urlContext);
    const [user, setUser] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({ email: '', password: '' });
    const [fadeAnim] = useState(new Animated.Value(0));
    const [showPassword, setShowPassword] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [loading, setLoading] = useState(false);
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
                setErrors({ email: '', password: '' });
                setLoginAttempts(0);
                setShowPassword(false);
                setLoading(false);
            };
        }, [])
    );

    const onChange = (name, value) => {
        setUser({ ...user, [name]: value });
        if (name === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            setErrors({ ...errors, email: emailRegex.test(value) || value === '' ? '' : 'Invalid email format' });
        } else if (name === 'password') {
            setErrors({ ...errors, password: value.length >= 6 || value === '' ? '' : 'Minimum 6 characters' });
        }
    };

    const handlePress = async () => {
        if (!user.email || !user.password) {
            Alert.alert('Missing Fields', 'Please enter both email and password.');
            return;
        }
        if (errors.email || errors.password) {
            Alert.alert('Input Error', 'Please correct the errors before proceeding.');
            return;
        }

        if (loginAttempts >= MAX_ATTEMPTS) {
            Alert.alert('Too Many Attempts', 'Please wait 30 seconds before trying again.');
            setTimeout(() => setLoginAttempts(0), 30000);
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${url}/userlogin`, user);
            Alert.alert('Success', res.data.message);
            if (res.data.message === "Login successful") {
                setCuser(user.email);
                navigation.navigate("userdash");
            }
        } catch (error) {
            setLoginAttempts(prev => prev + 1);
            Alert.alert('Login Failed', error.response?.data?.message || 'Please check your credentials and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.container}>
            <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
                <View style={styles.header}>
                    <Text style={styles.title}>User Sign-In</Text>
                    <Text style={styles.subtitle}>Access your secure file-sharing account</Text>
                </View>

                <View style={styles.inputContainer}>
                    {/* Email Input */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.inputRow}>
                            <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                            <TextInput
                                value={user.email}
                                onChangeText={(value) => onChange('email', value)}
                                placeholder="Email Address"
                                style={[styles.input, errors.email ? styles.inputError : null]}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.inputRow}>
                            <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                            <TextInput
                                value={user.password}
                                onChangeText={(value) => onChange('password', value)}
                                placeholder="Password"
                                style={[styles.input, errors.password ? styles.inputError : null]}
                                secureTextEntry={!showPassword}
                                placeholderTextColor="#94A3B8"
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color="#94A3B8"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                    </View>

                    {/* Forgot Password */}
                    <TouchableOpacity
                        style={styles.forgotPassword}
                        onPress={() => Alert.alert('Info', 'Password reset feature coming soon!')}
                    >
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.buttonDisabled]}
                        onPress={handlePress}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={loading ? ["#6B7280", "#6B7280"] : ["#10B981", "#22C55E"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buttonGradient}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.loginButtonText}>Sign In</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Navigation Links */}
                    <View style={styles.linksContainer}>
                        <TouchableOpacity onPress={() => navigation.navigate("userregister")}>
                            <Text style={styles.linkText}>New User? Sign Up</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate("slogin")}>
                            <Text style={styles.linkText}>Admin Login</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <Text style={styles.footerText}>© 2025 Trupod</Text>
                </View>
            </Animated.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    formContainer: {
        width: '100%',
        maxWidth: 400,
        padding: 28,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 30,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
        fontFamily: 'System',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '400',
        fontFamily: 'System',
    },
    inputContainer: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 20,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#D1D5DB',
        borderWidth: 1,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
    },
    inputIcon: {
        marginLeft: 12,
    },
    input: {
        flex: 1,
        height: 50,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#1F2937',
        fontFamily: 'System',
    },
    inputError: {
        borderColor: '#EF4444',
    },
    eyeButton: {
        padding: 10,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 6,
        fontWeight: '400',
        fontFamily: 'System',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotText: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline',
        fontFamily: 'System',
    },
    loginButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
    },
    buttonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
        fontFamily: 'System',
    },
    linksContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    linkText: {
        color: '#3B82F6',
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline',
        fontFamily: 'System',
    },
    footerText: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        fontFamily: 'System',
    },
});