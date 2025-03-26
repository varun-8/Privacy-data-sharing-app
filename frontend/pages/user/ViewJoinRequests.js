import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Button, Alert } from "react-native";
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";

export default function ViewJoinRequests() {
  const { url } = useContext(urlContext);
  const { cuser } = useContext(userContext);

  const [data, setData] = useState([]); // Data state to store fetched requests
  const [loading, setLoading] = useState(true); // Loading state to show loading spinner
  const [error, setError] = useState(null); // Error state for handling errors

  // Fetch data from the backend API
  const fetchData = async () => {
    try {
      const res = await axios.get(`${url}/getjoinrequests/${cuser}`);
      
      console.log("Response from backend:", res.data);  // Debug the response from backend

      setData(res.data.requests_with_groupnames || []); // Store fetched data
      setLoading(false); // Stop loading spinner
    } catch (err) {
      console.error("Error fetching user requests:", err);  
      setError("Error fetching user requests."); // Set error message
      setLoading(false); // Stop loading spinner
    }
  };

  useEffect(() => {
    fetchData(); // Fetch data when component mounts
  }, [cuser]); // Re-fetch if `cuser` changes

  // Return a loading screen while data is being fetched
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0057D8" />
        <Text>Loading requests...</Text>
      </View>
    );
  }

  // Return error screen if there's an error in fetching data
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Text>Please try again later.</Text>
      </View>
    );
  }

  // If no data is found, show a message saying no requests were found
  if (data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.noRequestsText}>No requests found.</Text>
      </View>
    );
  }

  const handleAllow=async(gid)=>{
    const res = await axios.get(`${url}/allowjoin/${gid}`)
    Alert.alert(res.data.message)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Join Requests</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item._id} 
        renderItem={({ item }) => (
          <View style={styles.requestItem}>
            <Text style={styles.groupName}>Requestor: {item.requestor}</Text>
            <Text style={styles.groupName}>Group Name: {item.gname}</Text>
            <Text>Status: {item.status}</Text>
            <Button title="Allow" onPress={()=>handleAllow(item._id)}></Button>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  requestItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  groupName: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  noRequestsText: {
    textAlign: "center",
    fontSize: 18,
    color: "#888",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 18,
  },
});
