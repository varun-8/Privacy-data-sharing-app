import { useRoute } from "@react-navigation/native";
import axios from "axios";
import { useEffect, useState, useContext } from "react";
import { Text, View, FlatList, Button, StyleSheet, Alert } from "react-native";
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";

export default function SeeFiles() {
  const route = useRoute();
  const { gid } = route.params; // Group ID from navigation params

  const { url } = useContext(urlContext);
  const { cuser } = useContext(userContext);

  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${url}/getfiles/${gid}`);
      setData(res.data.files || []); // Ensure data is an array, default to empty if undefined
    } catch (error) {
      console.error("Error fetching files:", error);
      Alert.alert("Error", "There was an issue fetching the files.");
    }
  };

  useEffect(() => {
    fetchData();
  }, [gid]); // Re-fetch if gid changes

  const handleDownload = async (fid) => {
    try {
      const res = await axios.get(`${url}/download/${fid}/${cuser}`);
      if (res.data.message) {
        Alert.alert("Success", res.data.message); // "Decrypted file sent successfully"
      } else {
        Alert.alert("Error", "Unexpected response from server.");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      Alert.alert("Error", "There was an issue downloading the file.");
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.fileItem}>
        <Text style={styles.fileName}>File Name: {item.file_name}</Text>
        <Text style={styles.fileInfo}>Uploaded by: {item.user}</Text>
        {/* Display the message if it exists */}
        {item.message ? (
          <Text style={styles.message}>Message: {item.message}</Text>
        ) : (
          <Text style={styles.noMessage}>No message attached</Text>
        )}
        <Button
          title="Download"
          onPress={() => handleDownload(item._id)}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Files in Group </Text>
      {data.length === 0 ? (
        <Text style={styles.noFiles}>No files available for this group.</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text>No files found.</Text>} // Fallback for empty list
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f4f4",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  fileItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3, // For Android shadow
  },
  fileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  fileInfo: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  message: {
    fontSize: 14,
    color: "#444",
    marginTop: 5,
    fontStyle: "normal",
  },
  noMessage: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
    fontStyle: "italic",
  },
  noFiles: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
});