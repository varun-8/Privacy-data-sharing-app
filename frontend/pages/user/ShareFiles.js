import React, { useState, useContext } from 'react';
import { useRoute } from '@react-navigation/native';
import { Text, View, Button, StyleSheet, Alert, TextInput } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { urlContext } from '../../urlContext';
import { userContext } from '../../userContext';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker'; // Import Picker for dropdown

export default function ShareFiles() {
  const route = useRoute();
  const { name } = route.params;

  const { cuser } = useContext(userContext);
  const { url } = useContext(urlContext);

  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [expirationPeriod, setExpirationPeriod] = useState('never'); // Default to 'never'

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      console.log("Document Picker Result:", result);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFile(result.assets[0]);
      } else if (result.canceled) {
        console.log('File picking canceled');
        Alert.alert('File picking canceled', 'You did not pick a file.');
      } else {
        console.log('No file selected');
        Alert.alert('Error', 'No file was selected.');
      }
    } catch (err) {
      console.error("Error picking document:", err);
      Alert.alert('Error', 'There was an issue picking the file.');
    }
  };

  const uploadFile = async () => {
    if (!file) {
      Alert.alert('No file selected', 'Please pick a file before uploading.');
      return;
    }

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/octet-stream',
    });
    formData.append('group', name);
    formData.append('user', cuser);
    if (message.trim()) {
      formData.append('message', message);
    }
    formData.append('expiration_period', expirationPeriod); // Add expiration period in seconds

    try {
      const response = await axios.post(`${url}/fileupload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const responseJson = response.data;
      if (responseJson.message) {
        Alert.alert('Upload successful', responseJson.message);
        setFile(null);
        setMessage('');
        setExpirationPeriod('never'); // Reset to default
      } else {
        Alert.alert('Upload failed', 'There was an issue uploading the file.');
      }
    } catch (error) {
      console.error('Error during file upload:', error);
      Alert.alert('Error', 'There was an error uploading the file.');
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Pick a file" onPress={pickFile} />
      {file && (
        <View style={styles.fileDetails}>
          <Text>File Name: {file.name}</Text>
        </View>
      )}
      <TextInput
        style={styles.input}
        placeholder="Enter your message (optional)"
        value={message}
        onChangeText={setMessage}
        multiline
      />
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Delete file after:</Text>
        <Picker
          selectedValue={expirationPeriod}
          style={styles.picker}
          onValueChange={(itemValue) => setExpirationPeriod(itemValue)}
        >
          <Picker.Item label="Never" value="never" />
          <Picker.Item label="30 Seconds" value="30" />
          <Picker.Item label="1 Minute" value="60" />
          <Picker.Item label="5 Minutes" value="300" />
          <Picker.Item label="30 Minutes" value="1800" />
          <Picker.Item label="1 Hour" value="3600" />
        </Picker>
      </View>
      <Button title="Upload File" onPress={uploadFile} disabled={!file} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fileDetails: {
    marginTop: 20,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 100,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 20,
    padding: 10,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    width: '100%',
    marginTop: 20,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#1A3552',
    marginBottom: 5,
  },
  picker: {
    width: '100%',
    height: 50,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
  },
});