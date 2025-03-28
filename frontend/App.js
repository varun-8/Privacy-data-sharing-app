import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { UrlProvider } from './urlContext';
import { UserProvider } from './userContext';
import { View, Text, StyleSheet, Animated, Easing, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';

// Super Admin Screens
import Sdash from './pages/superadmin/Sdash';
import Slogin from './pages/superadmin/Slogin';
import Sregister from './pages/superadmin/Sregister';
import ManageUsers from './pages/superadmin/ManageUsers';
import ViewRequests from './pages/superadmin/ViewRequests';
import ManageGroups from './pages/superadmin/ManageGroups';
import Settings from './pages/superadmin/Settings';
import FailedLogins from './pages/superadmin/FailedLogins';

// User Screens
import UserRegister from './pages/user/UserRegister';
import UserLogin from './pages/user/UserLogin';
import UserDash from './pages/user/UserDash';
import ViewYourGroups from './pages/user/ViewYourGroups';
import ViewUserRequests from './pages/user/ViewRequests';
import ViewAllGroups from './pages/user/ViewAllGroups';
import ViewJoinRequests from './pages/user/ViewJoinRequests';
import GroupChat from './pages/user/GroupChat';
import SeeFiles from './pages/user/SeeFiles';     // Added SeeFiles
import ShareFiles from './pages/user/ShareFiles'; // Added ShareFiles

// Splash Screen Component
const SplashScreen = () => {
  const [fadeAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [rotateAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        delay: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, [fadeAnim, scaleAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
      <Animated.Image
        source={require('./assets/icon.png')}
        style={[styles.logoImage, { transform: [{ scale: scaleAnim }] }]}
      />
      <Text style={styles.splashText}>Secure File Sharing</Text>
      <Animated.View style={[styles.loaderContainer, { transform: [{ rotate: spin }] }]}>
        <Ionicons name="reload-outline" size={24} color="#14B8A6" />
      </Animated.View>
    </Animated.View>
  );
};

const Stack = createStackNavigator();

// Custom Navigation Theme
const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6366F1',
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#1F2937',
    border: '#D1D5DB',
  },
};

// Custom Header with Back Button
const getHeaderOptions = (navigation, route) => ({
  headerStyle: {
    backgroundColor: '#6366F1',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: {
    fontSize: 20,
    fontFamily: 'Roboto-Medium',
    fontWeight: '600',
  },
  headerLeft: () => (
    <TouchableOpacity
      style={styles.headerButton}
      onPress={() => {
        if (route.name === 'slogin' || route.name === 'userlogin') {
          navigation.replace(route.name);
        } else {
          navigation.goBack();
        }
      }}
    >
      <Ionicons name="arrow-back-outline" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  ),
  headerLeftContainerStyle: {
    paddingLeft: 12,
  },
});

// Fast and Professional Transition Animation
const screenOptions = {
  cardStyle: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 250,
        easing: Easing.out(Easing.ease),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 200,
        easing: Easing.in(Easing.ease),
      },
    },
  },
  cardStyleInterpolator: ({ current, layouts }) => ({
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width * 0.8, 0],
          }),
        },
        {
          scale: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.95, 1],
          }),
        },
      ],
      opacity: current.progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.8, 1],
      }),
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.3],
      }),
    },
  }),
};

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  // Load Roboto fonts
  let [fontsLoaded] = useFonts({
    'Roboto-Regular': Roboto_400Regular,
    'Roboto-Medium': Roboto_500Medium,
    'Roboto-Bold': Roboto_700Bold,
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-ExtraBoldItalic': require('./assets/fonts/Poppins-ExtraBoldItalic.ttf'),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 1600);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.fontLoadingContainer}>
        <Ionicons name="lock-closed-outline" size={40} color="#6366F1" />
      </View>
    );
  }

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
                  title: 'Admin Login',
                  ...getHeaderOptions(navigation, route),
                  headerLeft: null,
                })}
              />
              <Stack.Screen
                name="sdash"
                component={Sdash}
                options={({ navigation, route }) => ({
                  title: 'Admin Dashboard',
                  ...getHeaderOptions(navigation, route),
                })}
              />
              <Stack.Screen
                name="sregister"
                component={Sregister}
                options={({ navigation, route }) => ({
                  title: 'Admin Register',
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
              <Stack.Screen
                name="failedlogins"
                component={FailedLogins}
                options={({ navigation, route }) => ({
                  title: 'Failed Logins',
                  ...getHeaderOptions(navigation, route),
                })}
              />

              {/* User Screens */}
              <Stack.Screen
                name="userregister"
                component={UserRegister}
                options={({ navigation, route }) => ({
                  title: 'Sign Up',
                  ...getHeaderOptions(navigation, route),
                })}
              />
              <Stack.Screen
                name="userlogin"
                component={UserLogin}
                options={({ navigation, route }) => ({
                  title: 'Login',
                  ...getHeaderOptions(navigation, route),
                  headerLeft: null,
                })}
              />
              <Stack.Screen
                name="userdash"
                component={UserDash}
                options={({ navigation, route }) => ({
                  title: 'Dashboard',
                  ...getHeaderOptions(navigation, route),
                })}
              />
              <Stack.Screen
                name="viewyourgroups"
                component={ViewYourGroups}
                options={({ navigation, route }) => ({
                  title: 'My Groups',
                  ...getHeaderOptions(navigation, route),
                })}
              />
              <Stack.Screen
                name="viewallgroups"
                component={ViewAllGroups}
                options={({ navigation, route }) => ({
                  title: 'Explore Groups',
                  ...getHeaderOptions(navigation, route),
                })}
              />
              <Stack.Screen
                name="viewuserrequests"
                component={ViewUserRequests}
                options={({ navigation, route }) => ({
                  title: 'My Requests',
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
                name="groupchat"
                component={GroupChat}
                options={({ navigation, route }) => ({
                  title: 'Group Chat',
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
              <Stack.Screen
                name="sharefiles"
                component={ShareFiles}
                options={({ navigation, route }) => ({
                  title: 'Share Files',
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
    backgroundColor: '#FFFFFF',
  },
  logoImage: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  splashText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#6366F1',
    textAlign: 'center',
    fontFamily: 'Roboto-Bold',
    marginBottom: 20,
  },
  loaderContainer: {
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 50,
    elevation: 2,
  },
  fontLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  headerButton: {
    padding: 12,
  },
});