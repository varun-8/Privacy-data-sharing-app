import React, { useState, useContext } from 'react'; // Add React here
import { View, Text, Alert, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import axios from 'axios';
import { urlContext } from '../../urlContext';
import { useNavigation } from '@react-navigation/native';

export default function UserRegister() {
  const navigation = useNavigation();
  const { url } = useContext(urlContext);
  const [user, setUser] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleChange = (field, value) => {
    setUser({
      ...user,
      [field]: value
    });
  };

  const handlePress = async () => {
    if (user.name !== '' && user.password !== '' && user.email !== '') {
      try {
        const res = await axios.post(`${url}/userregister`, user);
        Alert.alert('Success', res.data.message);
        if (res.data.message === "User Added Successfully!") {
          navigation.navigate('userlogin');
        }
      } catch (error) {
        Alert.alert("Error", error.response?.data?.message || "Something went wrong.");
      }
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>User Registration</Text>
      <View style={styles.inputContainer}>
        <TextInput
          value={user.name}
          onChangeText={(value) => handleChange('name', value)}
          placeholder="Your Name"
          style={styles.input}
          placeholderTextColor="#8B95A6"
        />
        <TextInput
          value={user.email}
          onChangeText={(value) => handleChange('email', value)}
          placeholder="Your Email"
          style={styles.input}
          keyboardType="email-address"
          placeholderTextColor="#8B95A6"
        />
        <TextInput
          value={user.password}
          onChangeText={(value) => handleChange('password', value)}
          placeholder="Your Password"
          style={styles.input}
          secureTextEntry
          placeholderTextColor="#8B95A6"
        />
        <TouchableOpacity style={styles.registerButton} onPress={handlePress}>
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('userlogin')} style={styles.link}>
          <Text style={styles.linkText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.footerText}>© 2025 Your App Name</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0F2F5',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2A2E43',
    marginBottom: 40,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 25,
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  input: {
    width: '100%',
    height: 52,
    borderColor: '#D1D9E0',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    paddingLeft: 15,
    paddingRight: 15,
    fontSize: 16,
    color: '#2A2E43',
    backgroundColor: '#F9FAFB',
  },
  registerButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#6200EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  link: {
    alignItems: 'center',
  },
  linkText: {
    color: '#6200EE',
    fontSize: 15,
    fontWeight: '500',
    textDecorationLine: 'underline',
    paddingVertical: 5,
  },
  footerText: {
    position: 'absolute',
    bottom: 20,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
});