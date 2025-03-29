import React, { useState, useContext, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import axios from 'axios';
import { urlContext } from '../../urlContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function UserRegister() {
  const navigation = useNavigation();
  const { url } = useContext(urlContext);
  const [user, setUser] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Fade-in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Input change handler with validation
  const handleChange = (field, value) => {
    setUser({ ...user, [field]: value });
    if (field === 'name') {
      setErrors({ ...errors, name: value.trim() ? '' : 'Name is required' });
    } else if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setErrors({ ...errors, email: emailRegex.test(value) || value === '' ? '' : 'Invalid email format' });
    } else if (field === 'password') {
      setErrors({ ...errors, password: value.length >= 6 || value === '' ? '' : 'Minimum 6 characters' });
    }
  };

  // Registration handler
  const handlePress = async () => {
    // Check for empty fields
    if (!user.name || !user.email || !user.password) {
      setErrors({
        name: !user.name ? 'Name is required' : '',
        email: !user.email ? 'Email is required' : errors.email,
        password: !user.password ? 'Password is required' : errors.password,
      });
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    // Check for validation errors
    if (errors.name || errors.email || errors.password) {
      Alert.alert('Form Error', 'Please correct the errors before proceeding.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${url}/userregister`, user);
      Alert.alert('Success', res.data.message);
      if (res.data.message === "User Added Successfully!") {
        navigation.navigate('userlogin');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.container}>
      <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join our secure file-sharing platform</Text>
        </View>

        <View style={styles.inputContainer}>
          {/* Name Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                value={user.name}
                onChangeText={(value) => handleChange('name', value)}
                placeholder="Full Name"
                style={[styles.input, errors.name ? styles.inputError : null]}
                placeholderTextColor="#94A3B8"
              />
            </View>
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                value={user.email}
                onChangeText={(value) => handleChange('email', value)}
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
                onChangeText={(value) => handleChange('password', value)}
                placeholder="Password"
                style={[styles.input, errors.password ? styles.inputError : null]}
                secureTextEntry
                placeholderTextColor="#94A3B8"
              />
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.buttonDisabled]}
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
                <Text style={styles.registerButtonText}>Register</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity onPress={() => navigation.navigate('userlogin')}>
            <Text style={styles.linkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>© 2025 Trupod</Text>
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
    maxWidth: 420,
    padding: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
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
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '400',
    fontFamily: 'System',
  },
  registerButton: {
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
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  linkText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontFamily: 'System',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'System',
  },
});