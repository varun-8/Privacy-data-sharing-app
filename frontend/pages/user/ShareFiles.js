import React, { useState, useContext } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
    Text,
    View,
    TouchableOpacity,
    StyleSheet,
    Alert,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { urlContext } from '../../urlContext';
import { userContext } from '../../userContext';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

export default function ShareFiles() {
    const route = useRoute();
    const navigation = useNavigation();
    const { name } = route.params;

    const { cuser } = useContext(userContext);
    const { url } = useContext(urlContext);

    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [expirationPeriod, setExpirationPeriod] = useState('never');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Pick a file
    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
            console.log('Document Picker Result:', result);
            if (!result.canceled && result.assets && result.assets.length > 0) {
                setFile(result.assets[0]);
                setError(null);
            } else if (result.canceled) {
                Alert.alert('Cancelled', 'File picking was cancelled.');
            } else {
                Alert.alert('Error', 'No file was selected.');
            }
        } catch (err) {
            console.error('Error picking document:', err);
            Alert.alert('Error', 'There was an issue picking the file.');
        }
    };

    // Cancel file selection
    const cancelFile = () => {
        setFile(null);
        setError(null);
    };

    // Upload file
    const uploadFile = async () => {
        if (!file) {
            Alert.alert('Error', 'Please pick a file to upload.');
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream',
        });
        formData.append('group', name);
        formData.append('user', cuser);
        if (message.trim()) formData.append('message', message);
        formData.append('expiration_period', expirationPeriod);

        try {
            console.log(`Uploading to: ${url}/fileupload`);
            const response = await axios.post(`${url}/fileupload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 10000, // Increased timeout for reliability
            });
            console.log('Upload response:', response.data);
            Alert.alert('Success', response.data.message, [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
            setFile(null);
            setMessage('');
            setExpirationPeriod('never');
        } catch (error) {
            console.error('Error during file upload:', {
                message: error.message,
                code: error.code,
                response: error.response?.data,
            });
            let errorMessage = 'Failed to upload file.';
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Upload timed out. The file might still be processing.';
            } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                errorMessage = 'Server unreachable. Ensure the server is running.';
            } else if (error.response) {
                errorMessage = error.response.data.message || 'Server error.';
            }
            setError(errorMessage);
            Alert.alert('Error', errorMessage, [
                { text: 'Retry', onPress: () => uploadFile() },
                { text: 'OK' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={["#F7FAFC", "#EDF2F7"]} style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.header}>Share Files to {name}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelHeaderButton}>
                    <Ionicons name="close" size={22} color="#4299E1" />
                </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
                {/* Pick File Button */}
                <TouchableOpacity
                    style={styles.pickButton}
                    onPress={pickFile}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={["#4299E1", "#7F9CF5"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.pickGradient}
                    >
                        <Ionicons name="document-attach-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Pick a File</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* File Preview */}
                {file && (
                    <View style={styles.filePreview}>
                        <Text style={styles.fileDetailText}>Name: {file.name}</Text>
                        <Text style={styles.fileDetailText}>
                            Size: {(file.size / 1024).toFixed(2)} KB
                        </Text>
                        <Text style={styles.fileDetailText}>Type: {file.mimeType || 'Unknown'}</Text>
                        <TouchableOpacity style={styles.cancelButton} onPress={cancelFile}>
                            <Ionicons name="close-circle-outline" size={18} color="#E53E3E" />
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Message Input */}
                <TextInput
                    style={styles.input}
                    placeholder="Add a message (optional)"
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    placeholderTextColor="#A0AEC0"
                    editable={!loading}
                />

                {/* Expiration Picker */}
                <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>Delete file after:</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={expirationPeriod}
                            style={styles.picker}
                            onValueChange={(itemValue) => setExpirationPeriod(itemValue)}
                            enabled={!loading}
                        >
                            <Picker.Item label="Never" value="never" />
                            <Picker.Item label="5 Minutes" value="300" />
                            <Picker.Item label="30 Minutes" value="1800" />
                            <Picker.Item label="1 Hour" value="3600" />
                            <Picker.Item label="12 Hours" value="43200" />
                            <Picker.Item label="1 Day" value="86400" />
                            <Picker.Item label="30 Days" value="2592000" />
                            <Picker.Item label="1 Year" value="31536000" />
                        </Picker>
                    </View>
                </View>

                {/* Error Message */}
                {error && <Text style={styles.errorText}>{error}</Text>}

                {/* Upload Button */}
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={uploadFile}
                    disabled={!file || loading}
                >
                    <LinearGradient
                        colors={!file || loading ? ["#A0AEC0", "#A0AEC0"] : ["#4299E1", "#7F9CF5"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.uploadGradient}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                                <Text style={styles.buttonText}>Upload File</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    header: {
        fontSize: 20,
        fontWeight: "600",
        color: "#2D3748",
        fontFamily: "System",
    },
    cancelHeaderButton: {
        padding: 8,
        backgroundColor: "#EDF2F7",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    formContainer: {
        flex: 1,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    pickButton: {
        borderRadius: 20,
        marginBottom: 16,
    },
    pickGradient: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    filePreview: {
        backgroundColor: "#EDF2F7",
        padding: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 16,
    },
    fileDetailText: {
        fontSize: 14,
        color: "#2D3748",
        marginBottom: 4,
        fontFamily: "System",
    },
    cancelButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
    },
    cancelText: {
        color: "#E53E3E",
        fontSize: 14,
        fontWeight: "500",
        marginLeft: 6,
        fontFamily: "System",
    },
    input: {
        width: "100%",
        height: 100,
        borderColor: "#E2E8F0",
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: "#2D3748",
        backgroundColor: "#FFFFFF",
        textAlignVertical: "top",
        marginBottom: 16,
        fontFamily: "System",
    },
    pickerContainer: {
        width: "100%",
        marginBottom: 16,
    },
    pickerLabel: {
        fontSize: 14,
        color: "#2D3748",
        marginBottom: 6,
        fontWeight: "500",
        fontFamily: "System",
    },
    pickerWrapper: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        overflow: "hidden",
    },
    picker: {
        width: "100%",
        height: 48,
        color: "#2D3748",
    },
    errorText: {
        fontSize: 14,
        color: "#E53E3E",
        textAlign: "center",
        marginBottom: 16,
        fontFamily: "System",
    },
    uploadButton: {
        borderRadius: 20,
    },
    uploadGradient: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
        fontFamily: "System",
    },
});