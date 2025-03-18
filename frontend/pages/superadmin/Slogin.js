import { useContext, useState } from 'react';
import { urlContext } from "../../urlContext";
import { Text, View, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';


export default function Slogin() {
    const navigation = useNavigation()
    
    const { url } = useContext(urlContext);
    const [user, setUser] = useState({
        email: '',
        password: ''
    });

    const onChange = (name, value) => {
        setUser({ ...user, [name]: value });
    };

    const handlePress = async () => {
        try {
            const res = await axios.post(`${url}/slogin`, user);
            Alert.alert(res.data.message);
            if(res.data.message === "Login successful")
            {
                navigation.navigate("sdash")
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Super Admin Login</Text>
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
                {/* <TouchableOpacity onPress={()=>{
                    navigation.navigate("sregister")
                }}>
                    <Text>New Admin Register</Text>
                </TouchableOpacity> */}

                <TouchableOpacity onPress={()=>{
                    navigation.navigate("userregister")
                }}>
                    <Text>I am user</Text>
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
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#333',
    },
    inputContainer: {
        width: '100%',
        maxWidth: 400,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 20,
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
});
