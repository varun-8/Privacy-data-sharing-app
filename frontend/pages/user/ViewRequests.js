import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";

export default function ViewUserRequests() {
  const { url } = useContext(urlContext);
  const { cuser } = useContext(userContext);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${url}/getuserrequests/${cuser}`);
      
      console.log("Response from backend:", res.data); 

      setData(res.data.requests_with_groupnames || []);  
      setLoading(false);
    } catch (err) {
      console.error("Error fetching user requests:", err);  
      setError("Error fetching user requests.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cuser]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0057D8" />
        <Text>Loading requests...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Text>Please try again later.</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.noRequestsText}>No requests found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Join Requests</Text>
      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.requestItem}>
            <Text style={styles.groupName}>Group Name: {item.gname}</Text>
            <Text>Status: {item.status}</Text>
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
