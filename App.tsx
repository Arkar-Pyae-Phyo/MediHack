// C:\Users\Admin\Desktop\medihack\MediHack\App.tsx
import React, { useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
// ✅ Import Icons ให้ครบถ้วน
import { Ionicons, FontAwesome5, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

// --- Screens: หมวดพยาบาล (Nurse) ---
import NurseDashboardScreen from './screens/Nurse/NurseDashboardScreen';       // 📋 รายชื่อคนไข้ (List)        // 🔄 ส่งเวร
import NursePatientConsoleScreen from './screens/Nurse/NursePatientConsoleScreen'; // 🩺 หน้าทำงานรายคน (Stack)

// --- Screens: หมวดหมอ (Doctor) ---
import DoctorHomeScreen from './screens/Doctor/DoctorHomeScreen';
import DoctorPatientsScreen from './screens/Doctor/DoctorPatientsScreen';
import DoctorAIScreen from './screens/Doctor/DoctorAIScreen';

// --- Screens: หมวดเภสัช (Pharmacist) ---
import PharmacistDashboardScreen from './screens/Pharmacist/PharmacistDashboardScreen'; // 💊 รายการรอตรวจสอบ
import PharmacistPatientConsoleScreen from './screens/Pharmacist/PharmacistPatientConsoleScreen'; // 🧪 หน้าทำงานรายคน (Stack)

// --- Screens: Login ---
import LoginScreen from './screens/LoginScreen';

// --- Screens: หมวดคนไข้ (Patient) ---
import PatientSummaryScreen from './screens/Patient/PatientSummaryScreen';
import PatientHealthScreen from './screens/Patient/PatientHealthScreen';
import PatientChatScreen from './screens/Patient/PatientChatScreen';

// --- Types Definition ---
type RootStackParamList = {
  Login: undefined;
  
  // Roots (Tabs)
  DoctorRoot: undefined;
  NurseRoot: undefined;
  PharmacistRoot: undefined;
  PatientRoot: undefined;

  // Detail Stacks (หน้าจอเจาะจงรายคน)
  NursePatientConsole: { an: string };      // รับ AN สำหรับพยาบาล
  PharmacistPatientConsole: { an: string }; // รับ AN สำหรับเภสัช
};

// ==========================================
// 🏥 1. Navbar พยาบาล (Nurse Tabs)
// ==========================================
const NurseTab = createBottomTabNavigator();
const NurseTabs = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <NurseTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0D9488', // Teal Color
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { height: 65, paddingBottom: 8, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color }) => {
          if (route.name === 'MyWard') return <MaterialCommunityIcons name="clipboard-list-outline" size={26} color={color} />;
          if (route.name === 'WardView') return <MaterialCommunityIcons name="hospital-building" size={26} color={color} />;
          if (route.name === 'Handover') return <MaterialCommunityIcons name="file-swap-outline" size={26} color={color} />;
        },
      })}
    >
      <NurseTab.Screen name="MyWard" options={{ title: 'Patient List' }}>
         {() => <NurseDashboardScreen onLogout={onLogout} />}
      </NurseTab.Screen>
      
      
    </NurseTab.Navigator>
  );
};

// ==========================================
// 💊 2. Navbar เภสัชกร (Pharmacist Tabs)
// ==========================================
const PharmacistTab = createBottomTabNavigator();
const PharmacistTabs = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <PharmacistTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#7C3AED', // Purple Color
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { height: 65, paddingBottom: 8, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <PharmacistTab.Screen 
        name="Dashboard" 
        options={{ 
          title: 'Rx Queue',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="pill" size={26} color={color} />
        }}
      >
        {() => <PharmacistDashboardScreen onLogout={onLogout} />}
      </PharmacistTab.Screen>
    </PharmacistTab.Navigator>
  );
};

// ==========================================
// 👨‍⚕️ 3. Navbar หมอ (Doctor Tabs)
// ==========================================
const DoctorTab = createBottomTabNavigator();
const DoctorTabs = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <DoctorTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0ea5e9', // Blue Color
        tabBarStyle: { height: 70, paddingBottom: 10, paddingTop: 10 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginBottom: 5 },
        tabBarIcon: ({ color }) => {
          if (route.name === 'Dashboard') return <Ionicons name="grid-outline" size={24} color={color} />;
          if (route.name === 'Patients') return <FontAwesome5 name="user-injured" size={20} color={color} />;
          if (route.name === 'ConsultAI') return <Ionicons name="bulb-outline" size={24} color={color} />;
        },
      })}
    >
      <DoctorTab.Screen name="Dashboard" options={{ title: 'Overview' }}>{() => <DoctorHomeScreen onLogout={onLogout} />}</DoctorTab.Screen>
      <DoctorTab.Screen name="Patients" options={{ title: 'Rounds' }}>{() => <DoctorPatientsScreen />}</DoctorTab.Screen>
      <DoctorTab.Screen name="ConsultAI" options={{ title: 'AI Consult' }}>{() => <DoctorAIScreen />}</DoctorTab.Screen>
    </DoctorTab.Navigator>
  );
};

// ==========================================
// 🏠 4. Navbar คนไข้ (Patient Tabs)
// ==========================================
const PatientTab = createBottomTabNavigator();
const PatientTabs = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <PatientTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarIcon: ({ color }) => {
          if (route.name === 'Summary') return <Ionicons name="home" size={24} color={color} />;
          if (route.name === 'Health') return <Ionicons name="pulse" size={24} color={color} />;
          if (route.name === 'Chat') return <Ionicons name="chatbubbles" size={24} color={color} />;
        },
      })}
    >
      <PatientTab.Screen name="Summary">{() => <PatientSummaryScreen onLogout={onLogout} />}</PatientTab.Screen>
      <PatientTab.Screen name="Health" component={PatientHealthScreen} />
      <PatientTab.Screen name="Chat" component={PatientChatScreen} />
    </PatientTab.Navigator>
  );
};

// ==========================================
// 🚀 Main Stack Navigator (ตัวจัดการหน้าจอหลัก)
// ==========================================
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  const handleLogin = (profile: { name: string; role: string }) => {
    setUser(profile);
  };

  const handleLogout = () => setUser(null);

  return (
    <NavigationContainer theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#f8fafc' } }}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {/* 1. Login Screen */}
        {!user ? (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLogin={handleLogin} />}
          </Stack.Screen>
        ) : (
          <>
            {/* 2. Doctor Role */}
            {user.role === 'Doctor' && (
              <Stack.Screen name="DoctorRoot">
                {() => <DoctorTabs onLogout={handleLogout} />}
              </Stack.Screen>
            )}
            
            {/* 3. Nurse Role */}
            {user.role === 'Nurse' && (
              <>
                <Stack.Screen name="NurseRoot">
                  {() => <NurseTabs onLogout={handleLogout} />}
                </Stack.Screen>
                {/* หน้า Console รายบุคคล (เด้งทับ Tab) */}
                <Stack.Screen 
                   name="NursePatientConsole" 
                   component={NursePatientConsoleScreen} 
                   options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} 
                />
              </>
            )}

            {/* 4. Pharmacist Role */}
            {user.role === 'Pharmacist' && (
              <>
                <Stack.Screen name="PharmacistRoot">
                  {() => <PharmacistTabs onLogout={handleLogout} />}
                </Stack.Screen>
                {/* หน้า Console เภสัชกร (เด้งทับ Tab) */}
                <Stack.Screen 
                   name="PharmacistPatientConsole" 
                   component={PharmacistPatientConsoleScreen} 
                   options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} 
                />
              </>
            )}

            {/* 5. Patient/Family Role */}
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