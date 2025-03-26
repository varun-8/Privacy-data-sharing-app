import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { UrlProvider } from './urlContext';
import { UserProvider } from './userContext';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For back button icon

// Super Admin Screens
import Sdash from './pages/superadmin/Sdash';
import Slogin from './pages/superadmin/Slogin';
import Sregister from './pages/superadmin/Sregister';
import ManageUsers from './pages/superadmin/ManageUsers';
import ViewRequests from './pages/superadmin/ViewRequests';
import ManageGroups from './pages/superadmin/ManageGroups';
import Settings from './pages/superadmin/Settings';

// User Screens
import UserRegister from './pages/user/UserRegister';
import UserLogin from './pages/user/UserLogin';
import UserDash from './pages/user/UserDash';
import ViewYourGroups from './pages/user/ViewYourGroups';
import ViewUserRequests from './pages/user/ViewRequests';
import ViewAllGroups from './pages/user/ViewAllGroups';
import ViewJoinRequests from './pages/user/ViewJoinRequests';
import ShareFiles from './pages/user/ShareFiles';
import SeeFiles from './pages/user/SeeFiles';

// Splash Screen Component
const SplashScreen = () => {
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      delay: 2500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
      <Text style={styles.logoText}>Data Sharing App</Text>
      <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
    </Animated.View>
  );
};

const Stack = createStackNavigator();

// Custom Navigation Theme
const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1E3A8A',
    background: '#F3F4F6',
    card: '#FFFFFF',
    text: '#1F2937',
    border: '#D1D5DB',
  },
};

// Custom Header with Back Button
const getHeaderOptions = (navigation, route) => ({
  headerStyle: {
    backgroundColor: '#1E3A8A',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerTintColor: '#FFD700',
  headerTitleStyle: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  headerLeft: () => (
    <TouchableOpacity
      style={styles.headerButton}
      onPress={() => {
        // Reset login screens when navigating back
        if (route.name === 'slogin' || route.name === 'userlogin') {
          navigation.replace(route.name); // Replace to reset state
        } else {
          navigation.goBack();
        }
      }}
    >
      <Ionicons name="arrow-back" size={24} color="#FFD700" />
    </TouchableOpacity>
  ),
  // Hide back button on initial screens
  headerLeftContainerStyle: {
    paddingLeft: 10,
  },
});

// Custom Transition Animation
const screenOptions = {
  cardStyle: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 400,
        easing: Easing.out(Easing.poly(4)),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 400,
        easing: Easing.in(Easing.poly(4)),
      },
    },
  },
  cardStyleInterpolator: ({ current, layouts }) => ({
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width, 0],
          }),
        },
      ],
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
      }),
    },
  }),
};

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <UrlProvider>
      <UserProvider>
        {isSplashVisible ? (
          <SplashScreen />
        ) : (
          <NavigationContainer theme={MyTheme}>
            <Stack.Navigator initialRouteName="userlogin" screenOptions={screenOptions}>
              {/* Super Admin Screens */}
              <Stack.Screen
                name="slogin"
                component={Slogin}
                options={({ navigation, route }) => ({
                  title: 'Super Admin Login',
                  ...getHeaderOptions(navigation, route),
                  headerLeft: null, // No back button on initial screen
                })}
              />
              <Stack.Screen
                name="sdash"
                component={Sdash}
                options={({ navigation, route }) => ({
                  title: 'Super Admin Dashboard',
                  ...getHeaderOptions(navigation, route),
                })}
              />
              <Stack.Screen
                name="sregister"
                component={Sregister}
                options={({ navigation, route }) => ({
                  title: 'Super Admin Register',
                  ...getHeaderOptions(navigation, route),
                })}
              />
              <Stack.Screen
                name="manageusers"
                component={ManageUsers}
                options={({ navigation, route }) => ({
                  title: 'Manage Users',
                  ...getHeaderOptions(navigation, route),
                })}
              />
              <Stack.Screen
                name="viewrequests"
                component={ViewRequests}
                options={({ navigation, route }) => ({
                  title: 'View Requests',
                  ...getHeaderOptions(navigation, route),
                })}
              />
              <Stack.Screen
                name="managegroups"
                component={ManageGroups}
                options={({ navigation, route }) => ({
                  title: 'Manage Groups',
                  ...getHeaderOptions(navigation, route),
                })}
              />
              <Stack.Screen
                name="settings"
                component={Settings}
                options={({ navigation, route }) => ({
                  title: 'Settings',
                  ...getHeaderOptions(navigation, route),
                })}
              />

              {/* User Screens */}
              <Stack.Screen
                name="userregister"
                component={UserRegister}
                options={({ navigation, route }) => ({
                  title: 'User Register',
                  ...getHeaderOptions(navigation, route),
                })}
              />
              <Stack.Screen
                name="userlogin"
                component={UserLogin}
                options={({ navigation, route }) => ({
                  title: 'User Login',
                  ...getHeaderOptions(navigation, route),
                  headerLeft: null, // No back button on initial screen
                })}
              />
              <Stack.Screen
                name="userdash"
                component={UserDash}
                options={({ navigation, route }) => ({
                  title: 'User Dashboard',
                  ...getHeaderOptions(navigation, route),
                })}
              />
              <Stack.Screen
                name="viewyourgroups"
                component={ViewYourGroups}
                options={({ navigation, route }) => ({
                  title: 'Your Groups',
                  ...getHeaderOptions(navigation, route),
                })}
              />
              <Stack.Screen
                name="viewallgroups"
                component={ViewAllGroups}
                options={({ navigation, route }) => ({
                  title: 'All Groups',
                  ...getHeaderOptions(navigation, route),
                })}
              />
              <Stack.Screen
                name="viewuserrequests"
                component={ViewUserRequests}
                options={({ navigation, route }) => ({
                  title: 'Requests',
                  ...getHeaderOptions(navigation, route),
                })}
              />
              <Stack.Screen
                name="viewjoinrequests"
                component={ViewJoinRequests}
                options={({ navigation, route }) => ({
                  title: 'Join Requests',
                  ...getHeaderOptions(navigation, route),
                })}
              />
              <Stack.Screen
                name="sharefiles"
                component={ShareFiles}
                options={({ navigation, route }) => ({
                  title: 'Share Files',
                  ...getHeaderOptions(navigation, route),
                })}
              />
              <Stack.Screen
                name="seefiles"
                component={SeeFiles}
                options={({ navigation, route }) => ({
                  title: 'See Files',
                  ...getHeaderOptions(navigation, route),
                })}
              />
            </Stack.Navigator>
          </NavigationContainer>
        )}
      </UserProvider>
    </UrlProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    fontFamily: 'Poppins-Bold', // Assuming font is loaded
  },
  loader: {
    marginTop: 25,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 80, // Larger header for prominence
    backgroundColor: '#1E3A8A', // Solid deep blue
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  headerButton: {
    padding: 15, // Increased for better touch area and balance
  },
  headerTitle: {
    flex: 1,
    fontSize: 24, // Larger for readability
    fontWeight: '700',
    color: '#FFD700', // Gold for contrast
    textAlign: 'center',
    fontFamily: 'Poppins-Bold', // Custom font for professionalism
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});