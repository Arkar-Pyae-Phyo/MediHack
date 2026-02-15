import React, { useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

import NurseDashboardScreen from './screens/Nurse/NurseDashboardScreen';
import NursePatientConsoleScreen from './screens/Nurse/NursePatientConsoleScreen';
import DoctorHomeScreen from './screens/Doctor/DoctorHomeScreen';
import DoctorPatientsScreen from './screens/Doctor/DoctorPatientsScreen';
import DoctorAIScreen from './screens/Doctor/DoctorAIScreen';
import DoctorProblemSummaryScreen from './screens/Doctor/DoctorProblemSummaryScreen';
import PharmacistDashboardScreen from './screens/Pharmacist/PharmacistDashboardScreen';
import PharmacistPatientConsoleScreen from './screens/Pharmacist/PharmacistPatientConsoleScreen';
import LoginScreen from './screens/LoginScreen';
import PatientSummaryScreen from './screens/Patient/PatientSummaryScreen';
import PatientHealthScreen from './screens/Patient/PatientHealthScreen';
import PatientChatScreen from './screens/Patient/PatientChatScreen';

type RootStackParamList = {
  Login: undefined;
  DoctorRoot: undefined;
  NurseRoot: undefined;
  PharmacistRoot: undefined;
  PatientRoot: undefined;
  NursePatientConsole: { an: string };
  PharmacistPatientConsole: { an: string };
};

const NurseTab = createBottomTabNavigator();
const PharmacistTab = createBottomTabNavigator();
const DoctorTab = createBottomTabNavigator();
const PatientTab = createBottomTabNavigator();

const NurseTabs = ({ onLogout }: { onLogout: () => void }) => (
  <NurseTab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#0D9488',
      tabBarInactiveTintColor: '#94A3B8',
      tabBarStyle: { height: 65, paddingBottom: 8, paddingTop: 8 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarIcon: ({ color }) => {
        if (route.name === 'MyWard') {
          return <MaterialCommunityIcons name="clipboard-list-outline" size={26} color={color} />;
        }
        return null;
      },
    })}
  >
    <NurseTab.Screen name="MyWard" options={{ title: 'Patient List' }}>
      {() => <NurseDashboardScreen onLogout={onLogout} />}
    </NurseTab.Screen>
  </NurseTab.Navigator>
);

const PharmacistTabs = ({ onLogout }: { onLogout: () => void }) => (
  <PharmacistTab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#7C3AED',
      tabBarInactiveTintColor: '#94A3B8',
      tabBarStyle: { height: 65, paddingBottom: 8, paddingTop: 8 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}
  >
    <PharmacistTab.Screen
      name="Dashboard"
      options={{
        title: 'Rx Queue',
        tabBarIcon: ({ color }) => <MaterialCommunityIcons name="pill" size={26} color={color} />,
      }}
    >
      {() => <PharmacistDashboardScreen onLogout={onLogout} />}
    </PharmacistTab.Screen>
  </PharmacistTab.Navigator>
);

const DoctorTabs = ({ onLogout }: { onLogout: () => void }) => (
  <DoctorTab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#0ea5e9',
      tabBarStyle: { height: 70, paddingBottom: 10, paddingTop: 10 },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginBottom: 5 },
      tabBarIcon: ({ color }) => {
        if (route.name === 'Dashboard') return <Ionicons name="grid-outline" size={24} color={color} />;
        if (route.name === 'Patients') return <FontAwesome5 name="user-injured" size={20} color={color} />;
        if (route.name === 'Problems') return <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={color} />;
        if (route.name === 'ConsultAI') return <Ionicons name="bulb-outline" size={24} color={color} />;
        return null;
      },
    })}
  >
    <DoctorTab.Screen name="Dashboard" options={{ title: 'Overview' }}>{() => <DoctorHomeScreen onLogout={onLogout} />}</DoctorTab.Screen>
    <DoctorTab.Screen name="Patients" options={{ title: 'Rounds' }}>{() => <DoctorPatientsScreen />}</DoctorTab.Screen>
    <DoctorTab.Screen name="Problems" options={{ title: 'Problem List' }}>
      {() => <DoctorProblemSummaryScreen />}
    </DoctorTab.Screen>
    <DoctorTab.Screen name="ConsultAI" options={{ title: 'AI Consult' }}>{() => <DoctorAIScreen />}</DoctorTab.Screen>
  </DoctorTab.Navigator>
);

const PatientTabs = ({ onLogout }: { onLogout: () => void }) => (
  <PatientTab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#2563eb',
      tabBarIcon: ({ color }) => {
        if (route.name === 'Summary') return <Ionicons name="home" size={24} color={color} />;
        if (route.name === 'Health') return <Ionicons name="pulse" size={24} color={color} />;
        if (route.name === 'Chat') return <Ionicons name="chatbubbles" size={24} color={color} />;
        return null;
      },
    })}
  >
    <PatientTab.Screen name="Summary">{() => <PatientSummaryScreen onLogout={onLogout} />}</PatientTab.Screen>
    <PatientTab.Screen name="Health" component={PatientHealthScreen} />
    <PatientTab.Screen name="Chat" component={PatientChatScreen} />
  </PatientTab.Navigator>
);

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  const handleLogin = (profile: { name: string; role: string }) => setUser(profile);
  const handleLogout = () => setUser(null);

  return (
    <NavigationContainer theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#f8fafc' } }}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLogin={handleLogin} />}
          </Stack.Screen>
        ) : (
          <>
            {user.role === 'Doctor' && (
              <Stack.Screen name="DoctorRoot">
                {() => <DoctorTabs onLogout={handleLogout} />}
              </Stack.Screen>
            )}

            {user.role === 'Nurse' && (
              <>
                <Stack.Screen name="NurseRoot">
                  {() => <NurseTabs onLogout={handleLogout} />}
                </Stack.Screen>
                <Stack.Screen
                  name="NursePatientConsole"
                  component={NursePatientConsoleScreen}
                  options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
                />
              </>
            )}

            {user.role === 'Pharmacist' && (
              <>
                <Stack.Screen name="PharmacistRoot">
                  {() => <PharmacistTabs onLogout={handleLogout} />}
                </Stack.Screen>
                <Stack.Screen
                  name="PharmacistPatientConsole"
                  component={PharmacistPatientConsoleScreen}
                  options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
                />
              </>
            )}

            {(user.role === 'Patient' || user.role === 'Family') && (
              <Stack.Screen name="PatientRoot">
                {() => <PatientTabs onLogout={handleLogout} />}
              </Stack.Screen>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
