import { useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// --- Screens: หมวดพนักงาน (Staff) ---
import DoctorDashboardScreen from './screens/DoctorScreen/DashboardScreen';
import DoctorHome from './screens/DoctorScreen/Home';
import Bardoctor from './components/bardoctor';
import NursePatientSelectScreen from './screens/NursePatientSelectScreen';
import NurseTasksScreen from './screens/NurseTasksScreen';
import NurseChecklistScreen from './screens/NurseChecklistScreen';
import PharmacistReviewScreen from './screens/PharmacistReviewScreen';
import LoginScreen from './screens/LoginScreen';
import type { Patient } from './screens/NursePatientSelectScreen';

// --- Screens: หมวดคนไข้ (Patient - ย้ายเข้าโฟลเดอร์แล้ว) ---
import PatientSummaryScreen from './screens/Patient/PatientSummaryScreen';
import PatientHealthScreen from './screens/Patient/PatientHealthScreen';
import PatientChatScreen from './screens/Patient/PatientChatScreen';

// --- Navigation Types ---
type RootStackParamList = {
  Login: undefined;
  PatientRoot: undefined;
  Doctor: undefined;
  NurseRoot: undefined;
  Pharmacist: undefined;
};

type NurseStackParamList = {
  PatientSelect: undefined;
  NurseTabs: { patient: Patient };
};

type PatientTabParamList = {
  Summary: undefined;
  Health: undefined;
  Chat: undefined;
};

type NurseTabParamList = {
  Tasks: undefined;
  Checklist: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const NurseStack = createNativeStackNavigator<NurseStackParamList>();
const PatientTab = createBottomTabNavigator<PatientTabParamList>();
const NurseTab = createBottomTabNavigator<NurseTabParamList>();
const DoctorTab = createBottomTabNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#fff' },
};

// --- Navbar ของคนไข้ ---
const PatientTabs = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <PatientTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { height: 60, paddingBottom: 8 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Summary') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Health') iconName = focused ? 'pulse' : 'pulse-outline';
          else if (route.name === 'Chat') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <PatientTab.Screen name="Summary" options={{ title: 'Home' }}>
        {() => <PatientSummaryScreen onLogout={onLogout} />}
      </PatientTab.Screen>
      <PatientTab.Screen name="Health" component={PatientHealthScreen} options={{ title: 'My Health' }} />
      <PatientTab.Screen  name="Chat" component={PatientChatScreen}  options={{ title: 'Ask AI' }} />
    </PatientTab.Navigator>
  );
};

// --- Navbar ของพยาบาล ---
const NurseTabs = ({ onLogout, patient }: { onLogout: () => void; patient: Patient }) => {
  return (
    <NurseTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { height: 60, paddingBottom: 8 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Tasks') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Checklist') iconName = focused ? 'checkbox' : 'checkbox-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <NurseTab.Screen name="Tasks" options={{ title: 'Tasks' }}>
        {() => <NurseTasksScreen onLogout={onLogout} patient={patient} />}
      </NurseTab.Screen>
      <NurseTab.Screen name="Checklist" options={{ title: 'AI Checklist' }}>
        {() => <NurseChecklistScreen onLogout={onLogout} patient={patient} />}
      </NurseTab.Screen>
    </NurseTab.Navigator>
  );
};

// --- Navigator สำหรับพยาบาล (เลือกคนไข้ก่อน) ---
const NurseNavigator = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <NurseStack.Navigator screenOptions={{ headerShown: false }}>
      <NurseStack.Screen name="PatientSelect">
        {({ navigation }) => (
          <NursePatientSelectScreen
            onLogout={onLogout}
            onSelectPatient={(patient) => navigation.navigate('NurseTabs', { patient })}
          />
        )}
      </NurseStack.Screen>
      <NurseStack.Screen name="NurseTabs">
        {({ route }) => <NurseTabs onLogout={onLogout} patient={route.params.patient} />}
      </NurseStack.Screen>
    </NurseStack.Navigator>
  );
};

export default function App() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  const handleLogin = (profile: { name: string; role: string }) => {
    // รวมกลุ่ม Family และ Patient ให้ใช้สิทธิ์เดียวกัน
    if (profile.role === 'Family' || profile.role === 'Patient') {
      setUser({ ...profile, role: 'Patient' }); 
    } else {
      setUser(profile);
    }
  };

  const handleLogout = () => setUser(null);

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLogin={handleLogin} />}
          </Stack.Screen>
        ) : (
          <>
            {user.role === 'Doctor' && (
              <Stack.Screen name="Doctor">
                {() => (
                  <DoctorTab.Navigator
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
                    <DoctorTab.Screen name="Home">{() => <DoctorHome onLogout={handleLogout} />}</DoctorTab.Screen>
                    <DoctorTab.Screen name="Dashboard">{() => <DoctorDashboardScreen onLogout={handleLogout} />}</DoctorTab.Screen>
                  </DoctorTab.Navigator>
                )}
              </Stack.Screen>
            )}
            {user.role === 'Nurse' && (
              <Stack.Screen name="NurseRoot">
                {() => <NurseNavigator onLogout={handleLogout} />}
              </Stack.Screen>
            )}
            {user.role === 'Pharmacist' && (
              <Stack.Screen name="Pharmacist">
                {() => <PharmacistReviewScreen onLogout={handleLogout} />}
              </Stack.Screen>
            )}
            {user.role === 'Patient' && (
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