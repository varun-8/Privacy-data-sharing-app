import { useState, useContext } from 'react';
import { View, Text, Button, Alert, TouchableOpacity, StyleSheet } from 'react-native';
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
        Alert.alert(res.data.message);
        if (res.data.message === "User Added Successfully!") {
          navigation.navigate('userlogin');
        }
      } catch (error) {
        Alert.alert("Error", error.response?.data?.message || "Something went wrong.");
      }
    } else {
      Alert.alert('Please fill in all fields');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Registration</Text>
      <View style={styles.inputContainer}>
        <TextInput
          value={user.name}
          onChangeText={(value) => handleChange('name', value)}
          placeholder="Enter Your name"
          style={styles.input}
        />
        <TextInput
          value={user.email}
          onChangeText={(value) => handleChange('email', value)}
          placeholder="Enter Your email"
          style={styles.input}
          keyboardType="email-address"
        />
        <TextInput
          value={user.password}
          onChangeText={(value) => handleChange('password', value)}
          placeholder="Enter Your password"
          style={styles.input}
          secureTextEntry
        />
        <Button title="Register" onPress={handlePress} color="#6200EE" />
        <TouchableOpacity onPress={() => navigation.navigate('userlogin')} style={styles.link}>
          <Text style={styles.linkText}>Already Have an account?</Text>
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
