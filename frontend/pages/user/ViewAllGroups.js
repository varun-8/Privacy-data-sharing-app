import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { urlContext } from "../../urlContext";
import { userContext } from "../../userContext";
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { StyleSheet } from 'react-native';


export default function ViewAllGroups() {
  const { url } = useContext(urlContext);
  const { cuser } = useContext(userContext);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${url}/getallgroups/${cuser}`);
      setData(res.data.groups);
      setLoading(false);
    } catch (err) {
      setError("Error fetching groups. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleJoin=async(groupId)=>{
    const res = await axios.get(`${url}/joinrequest/${cuser}/${groupId}`)
    Alert.alert(res.data.message)
  }

  const renderGroupItem = ({ item }) => (
    <View style={styles.groupCard}>
      <Text style={styles.groupName}>{item.name}</Text>
      <TouchableOpacity style={styles.viewButton} onPress={()=>handleJoin(item._id)}>
        <Text style={styles.viewButtonText}>Request to Join</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0057D8" />
        <Text style={styles.loadingText}>Loading Your Groups...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Groups</Text>
      </View>
      
        <FlatList
          data={data}
          keyExtractor={(item) => item._id.toString()} 
          renderItem={renderGroupItem}
          contentContainerStyle={styles.listContent}
        />

    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#0057D8',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  groupCard: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#0057D8',
    borderRadius: 5,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  retryButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ff9900',
    borderRadius: 5,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#333',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
});

