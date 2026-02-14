import { useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import PatientSummaryScreen from './screens/PatientSummaryScreen';
import DoctorDashboardScreen from './screens/DoctorScreen/DashboardScreen';
import DoctorHome from './screens/DoctorScreen/Home';
import Bardoctor from './components/bardoctor';
import NurseTasksScreen from './screens/NurseTasksScreen';
import PharmacistReviewScreen from './screens/PharmacistReviewScreen';
import LoginScreen from './screens/LoginScreen';

type RootStackParamList = {
  Login: undefined;
  Patient: undefined;
  Doctor: undefined;
  Nurse: undefined;
  Pharmacist: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#fff',
  },
};

const roleScreenMap = {
  Patient: PatientSummaryScreen,
  Doctor: DoctorDashboardScreen,
  Nurse: NurseTasksScreen,
  Pharmacist: PharmacistReviewScreen,
};

export default function App() {
  type UserProfile = {
    name: string;
    age: number;
    role: keyof typeof roleScreenMap;
  };

  const [user, setUser] = useState<UserProfile | null>(null);

  const handleLogin = (profile: { name: string; age: number; role: string }) => {
    if (profile.role && profile.role in roleScreenMap) {
      setUser({ 
        name: profile.name, 
        age: profile.age, 
        role: profile.role as keyof typeof roleScreenMap 
      });
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  const RoleScreen = user ? roleScreenMap[user.role] : null;

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user && RoleScreen ? (
          // For Doctor role we use a Bottom Tab navigator so we can use the custom Bardoctor tabBar
          user.role === 'Doctor' ? (
            <Stack.Screen name="Doctor">
              {() => (
                <Tab.Navigator
                  screenOptions={{ headerShown: false }}
                  tabBar={(props) => {
                    const routeName = props.state.routes[props.state.index].name;
                    const activeTab = routeName === 'Home' ? 'home' : 'dashboard';
                    const onNavigate = (tab: 'home' | 'dashboard') => {
                      const target = tab === 'home' ? 'Home' : 'Dashboard';
                      props.navigation.navigate(target as never);
                    };
                    return (
                      <Bardoctor
                        activeTab={activeTab}
                        onNavigate={onNavigate}
                        onLogout={handleLogout}
                      />
                    );
                  }}
                >
                  <Tab.Screen name="Home">{() => <DoctorHome onLogout={handleLogout} />}</Tab.Screen>
                  <Tab.Screen name="Dashboard">{() => <DoctorDashboardScreen onLogout={handleLogout} />}</Tab.Screen>
                </Tab.Navigator>
              )}
            </Stack.Screen>
          ) : (
            <Stack.Screen name={user.role}>
              {() => <RoleScreen onLogout={handleLogout} />}
            </Stack.Screen>
          )
        ) : (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLogin={handleLogin} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
