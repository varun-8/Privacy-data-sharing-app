import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function Sdash() {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>SUPER ADMIN DASHBOARD</Text>
            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                    navigation.navigate('viewrequests');
                }}
            >
                <Text style={styles.buttonText}>Requests</Text>
            </TouchableOpacity>
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
        textAlign: 'center',
        marginBottom: 40,
        color: '#333',
    },
    button: {
        backgroundColor: '#6200EE',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
    },
});
