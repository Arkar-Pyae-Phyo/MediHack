import { useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// --- Screens: หมวดพนักงาน (Staff) ---
import DoctorDashboardScreen from './screens/DoctorDashboardScreen';
import NurseTasksScreen from './screens/NurseTasksScreen';
import PharmacistReviewScreen from './screens/PharmacistReviewScreen';
import LoginScreen from './screens/LoginScreen';
import Chat from './components/Chat';

// --- Screens: หมวดคนไข้ (Patient - ย้ายเข้าโฟลเดอร์แล้ว) ---
import PatientSummaryScreen from './screens/Patient/PatientSummaryScreen';
import PatientHealthScreen from './screens/Patient/PatientHealthScreen';
import PatientChatScreen from './screens/Patient/PatientChatScreen';

// --- Navigation Types ---
type RootStackParamList = {
  Login: undefined;
  PatientRoot: undefined;
  Doctor: undefined;
  Nurse: undefined;
  Pharmacist: undefined;
};

type PatientTabParamList = {
  Summary: undefined;
  Health: undefined;
  Chat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<PatientTabParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#fff' },
};

// --- Navbar ของคนไข้ ---
const PatientTabs = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <Tab.Navigator
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
      <Tab.Screen name="Summary" options={{ title: 'Home' }}>
        {() => <PatientSummaryScreen onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Health" component={PatientHealthScreen} options={{ title: 'My Health' }} />
      <Tab.Screen  name="Chat" component={PatientChatScreen}  options={{ title: 'Ask AI' }} />
    </Tab.Navigator>
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
                {() => <DoctorDashboardScreen onLogout={handleLogout} />}
              </Stack.Screen>
            )}
            {user.role === 'Nurse' && (
              <Stack.Screen name="Nurse">
                {() => <NurseTasksScreen onLogout={handleLogout} />}
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