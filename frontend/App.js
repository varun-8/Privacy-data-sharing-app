
import Sdash from './pages/superadmin/Sdash';
import Slogin from './pages/superadmin/Slogin';
import Sregister from './pages/superadmin/Sregister';
import { UrlProvider } from './urlContext';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import UserRegister from './pages/user/UserRegister';
import UserLogin from './pages/user/UserLogin';
import UserDash from './pages/user/UserDash';
import { UserProvider } from './userContext';
import ViewRequests from './pages/superadmin/ViewRequests';
import ViewYourGroups from './pages/user/ViewYourGroups';

const Stack = createStackNavigator();


export default function App() {
  return (
    <UrlProvider>
      <UserProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="slogin">
          <Stack.Screen name="slogin" component={Slogin} />
          <Stack.Screen name="sdash" component={Sdash} />
          <Stack.Screen name="sregister" component={Sregister} />
          <Stack.Screen name='userregister' component={UserRegister}/>
          <Stack.Screen name='userlogin' component={UserLogin}/>
          <Stack.Screen name="userdash" component={UserDash} />
          <Stack.Screen name="viewrequests" component={ViewRequests}/>
          <Stack.Screen name="viewyourgroups" component={ViewYourGroups}/>
        </Stack.Navigator>
      </NavigationContainer>
      </UserProvider>
    </UrlProvider>
  );
}

