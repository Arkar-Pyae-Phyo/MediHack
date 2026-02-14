import { useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// --- Screens: หมวดพนักงาน (Staff) ---
import DoctorDashboardScreen from './screens/DoctorScreen/DashboardScreen';
import DoctorHome from './screens/DoctorScreen/Home';
import PatientDetailScreen from './screens/DoctorScreen/PatientDetailScreen';
import Bardoctor from './components/bardoctor';
import NursePatientSelectScreen from './screens/NursePatientSelectScreen';
import NurseTasksScreen from './screens/NurseTasksScreen';
import PharmacistReviewScreen from './screens/PharmacistReviewScreen';
import PharmacistPatientSelectScreen, { PharmacistPatient } from './screens/PharmacistPatientSelectScreen';
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
  NurseTasks: { patient: Patient };
};

type PharmacistStackParamList = {
  PatientSelect: undefined;
  Review: { patient: PharmacistPatient };
};

type PatientTabParamList = {
  Summary: undefined;
  Health: undefined;
  Chat: undefined;
};

type DoctorStackParamList = {
  DoctorTabs: undefined;
  PatientDetail: { patient: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const DoctorStack = createNativeStackNavigator<DoctorStackParamList>();
const NurseStack = createNativeStackNavigator<NurseStackParamList>();
const PharmacistStack = createNativeStackNavigator<PharmacistStackParamList>();
const PatientTab = createBottomTabNavigator<PatientTabParamList>();
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

// --- Navigator สำหรับพยาบาล (เลือกคนไข้ก่อน) ---
const NurseNavigator = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <NurseStack.Navigator screenOptions={{ headerShown: false }}>
      <NurseStack.Screen name="PatientSelect">
        {({ navigation }) => (
          <NursePatientSelectScreen
            onLogout={onLogout}
            onSelectPatient={(patient) => navigation.navigate('NurseTasks', { patient })}
          />
        )}
      </NurseStack.Screen>
      <NurseStack.Screen name="NurseTasks">
        {({ route }) => <NurseTasksScreen onLogout={onLogout} patient={route.params.patient} />}
      </NurseStack.Screen>
    </NurseStack.Navigator>
  );
};

const PharmacistNavigator = ({ onLogout }: { onLogout: () => void }) => (
  <PharmacistStack.Navigator screenOptions={{ headerShown: false }}>
    <PharmacistStack.Screen name="PatientSelect">
      {({ navigation }) => (
        <PharmacistPatientSelectScreen
          onLogout={onLogout}
          onSelectPatient={(patient) => navigation.navigate('Review', { patient })}
        />
      )}
    </PharmacistStack.Screen>
    <PharmacistStack.Screen name="Review">
      {({ route }) => (
        <PharmacistReviewScreen onLogout={onLogout} patient={route.params.patient} />
      )}
    </PharmacistStack.Screen>
  </PharmacistStack.Navigator>
);

// --- Navigator สำหรับหมอ (Home + Dashboard + Patient Detail) ---
const DoctorNavigator = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <DoctorStack.Navigator screenOptions={{ headerShown: false }}>
      <DoctorStack.Screen name="DoctorTabs">
        {({ navigation }) => (
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
                  onLogout={onLogout}
                />
              );
            }}
          >
            <DoctorTab.Screen name="Home">{() => <DoctorHome onLogout={onLogout} />}</DoctorTab.Screen>
            <DoctorTab.Screen name="Dashboard">
              {() => <DoctorDashboardScreen onLogout={onLogout} onPatientPress={(patient) => navigation.navigate('PatientDetail', { patient })} />}
            </DoctorTab.Screen>
          </DoctorTab.Navigator>
        )}
      </DoctorStack.Screen>
      <DoctorStack.Screen name="PatientDetail">
        {({ route, navigation }) => (
          <PatientDetailScreen
            patient={route.params.patient}
            onBack={() => navigation.goBack()}
          />
        )}
      </DoctorStack.Screen>
    </DoctorStack.Navigator>
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
                {() => <DoctorNavigator onLogout={handleLogout} />}
              </Stack.Screen>
            )}
            {user.role === 'Nurse' && (
              <Stack.Screen name="NurseRoot">
                {() => <NurseNavigator onLogout={handleLogout} />}
              </Stack.Screen>
            )}
            {user.role === 'Pharmacist' && (
              <Stack.Screen name="Pharmacist">
                {() => <PharmacistNavigator onLogout={handleLogout} />}
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