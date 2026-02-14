import { useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import PatientSummaryScreen from './screens/PatientSummaryScreen';
import DoctorDashboardScreen from './screens/DoctorDashboardScreen';
import NurseTasksScreen from './screens/NurseTasksScreen';
import PharmacistReviewScreen from './screens/PharmacistReviewScreen';
import FamilyViewScreen from './screens/FamilyViewScreen';
import LoginScreen from './screens/LoginScreen';

type RootStackParamList = {
  Login: undefined;
  Root: undefined;
};

type MainTabParamList = {
  Home: undefined;
  Patient: undefined;
  Doctor: undefined;
  Nurse: undefined;
  Pharmacist: undefined;
  Family: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#fff',
  },
};

const iconMap: Record<keyof MainTabParamList, ComponentProps<typeof Ionicons>['name']> = {
  Home: 'home',
  Patient: 'person',
  Doctor: 'medkit',
  Nurse: 'bandage',
  Pharmacist: 'flask',
  Family: 'people',
};

type MainTabsProps = {
  initialRoute: keyof MainTabParamList;
};

const MainTabs = ({ initialRoute }: MainTabsProps) => (
  <Tab.Navigator
    initialRouteName={initialRoute}
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#2b6cb0',
      tabBarInactiveTintColor: '#718096',
      tabBarIcon: ({ color, size }) => {
        const iconName = iconMap[route.name as keyof MainTabParamList];
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Patient" component={PatientSummaryScreen} />
    <Tab.Screen name="Doctor" component={DoctorDashboardScreen} />
    <Tab.Screen name="Nurse" component={NurseTasksScreen} />
    <Tab.Screen name="Pharmacist" component={PharmacistReviewScreen} />
    <Tab.Screen name="Family" component={FamilyViewScreen} />
  </Tab.Navigator>
);

export default function App() {
  type UserProfile = {
    name: string;
    role: keyof MainTabParamList;
  };

  const [user, setUser] = useState<UserProfile | null>(null);

  const initialRoute = useMemo<keyof MainTabParamList>(() => {
    return user?.role ?? 'Home';
  }, [user?.role]);

  const handleLogin = (profile: { name: string; role: string }) => {
    if (profile.role && profile.role in iconMap) {
      setUser({ name: profile.name, role: profile.role as keyof MainTabParamList });
    } else {
      setUser({ name: profile.name, role: 'Home' });
    }
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Root">
            {() => <MainTabs initialRoute={initialRoute} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLogin={handleLogin} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export type { MainTabParamList };
