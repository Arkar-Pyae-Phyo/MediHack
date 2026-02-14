import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Activity, 
  Stethoscope, 
  Pill, 
  Users, 
  ShieldCheck, 
  Info,
  ChevronDown, 
  ChevronUp    
} from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type LoginScreenProps = {
  onLogin: (user: { id: string; name: string; role: string }) => void;
};

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [detectedRole, setDetectedRole] = useState<{ label: string; color: string; icon: any } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Logic: Smart Role Detection (แก้ให้ถูกต้องตรงนี้) ---
  useEffect(() => {
    const id = staffId.toUpperCase();
    if (id.startsWith('DOC')) {
      setDetectedRole({ label: 'Doctor', color: '#2563EB', icon: Stethoscope });
    } else if (id.startsWith('NUR')) {
      setDetectedRole({ label: 'Nurse', color: '#059669', icon: Activity });
    } else if (id.startsWith('PHA')) { // เพิ่ม Pharmacist
      setDetectedRole({ label: 'Pharmacist', color: '#7C3AED', icon: Pill });
    } else if (id.startsWith('ADM')) { // เพิ่ม Admin
      setDetectedRole({ label: 'Admin', color: '#DC2626', icon: ShieldCheck });
    } else if (id.startsWith('FAM')) { // เพิ่ม Family
      setDetectedRole({ label: 'Family', color: '#EA580C', icon: Users });
    } else if (id.startsWith('PAT')) { // เพิ่ม Patient
      setDetectedRole({ label: 'Patient', color: '#EA580C', icon: Users });
    } else {
      setDetectedRole(null);
    }
  }, [staffId]);

  const toggleHint = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowHint(!showHint);
  };

  const handleLogin = () => {
    if (!staffId || !password) {
      Alert.alert('Missing Info', 'Please enter both Staff ID and Password.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const roleName = detectedRole ? detectedRole.label : 'Guest';
      const mockName = roleName === 'Doctor' ? 'Dr. Somsak' : 'Staff Member';
      onLogin({ id: staffId, name: mockName, role: roleName });
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.headerContainer}>
            <View style={styles.logoIconContainer}>
              <Activity size={32} color="#2563EB" />
            </View>
            <Text style={styles.appName}>Synapse<Text style={styles.appNameHighlight}>.OS</Text></Text>
            <Text style={styles.appTagline}>Healthcare Management & Communication</Text>
          </View>

          <View style={styles.card}>
            
            <View style={styles.labelRow}>
              <Text style={styles.label}>STAFF ID</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <User size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your ID (e.g. DOC1234, ADM1234)"
                placeholderTextColor="#94A3B8"
                value={staffId}
                onChangeText={setStaffId}
                autoCapitalize="characters"
              />
            </View>

            {/* Toggle Button */}
            {!detectedRole && (
              <TouchableOpacity style={styles.helpToggle} onPress={toggleHint} activeOpacity={1}>
                <Info size={14} color="#2563EB" style={{ marginRight: 4 }} />
                <Text style={styles.helpToggleText}>
                  {showHint ? "Hide ID formats" : "How do I format my ID?"}
                </Text>
                {showHint ? (
                  <ChevronUp size={14} color="#2563EB" />
                ) : (
                  <ChevronDown size={14} color="#2563EB" />
                )}
              </TouchableOpacity>
            )}

            {/* Hint Box (ส่วนแสดงผล ข้อความเท่านั้น ห้ามใส่ Logic ตรงนี้) */}
            {showHint && !detectedRole && (
              <View style={styles.hintBox}>
                <View style={styles.hintTextContainer}>
                  <Text style={styles.hintTitle}>Use these prefixes:</Text>
                  <Text style={styles.hintText}>• Doctor: <Text style={{fontWeight:'700', color:'#2563EB'}}>DOCxxxx</Text></Text>
                  <Text style={styles.hintText}>• Nurse: <Text style={{fontWeight:'700', color:'#059669'}}>NURxxxx</Text></Text>
                  <Text style={styles.hintText}>• Pharmacist: <Text style={{fontWeight:'700', color:'#7C3AED'}}>PHAxxxx</Text></Text>
                  <Text style={styles.hintText}>• Admin: <Text style={{fontWeight:'700', color:'#DC2626'}}>ADMxxxx</Text></Text>
                  <Text style={styles.hintText}>• Family: <Text style={{fontWeight:'700', color:'#EA580C'}}>FAMxxxx</Text></Text>
                  <Text style={styles.hintText}>• Patient: <Text style={{fontWeight:'700', color:'#EA580C'}}>PATxxxx</Text></Text>
                </View>
              </View>
            )}

            {/* Smart Badge */}
            {detectedRole && (
              <View style={[styles.roleBadge, { backgroundColor: detectedRole.color + '15' }]}>
                <detectedRole.icon size={16} color={detectedRole.color} />
                <Text style={[styles.roleBadgeText, { color: detectedRole.color }]}>
                  {detectedRole.label} Role Detected
                </Text>
              </View>
            )}

            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#64748B" />
                ) : (
                  <Eye size={20} color="#64748B" />
                )}
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login to Workspace</Text>
              )}
            </TouchableOpacity>

          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Need help accessing the system?
            </Text>
            <TouchableOpacity style={styles.supportLink}>
              <Text style={styles.footerSubText}>Contact IT Support</Text>
            </TouchableOpacity>
            
            <View style={styles.complianceRow}>
              <ShieldCheck size={14} color="#94A3B8" />
              <Text style={styles.complianceText}>SECURE CONNECTION</Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  appNameHighlight: {
    color: '#2563EB',
  },
  appTagline: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  helpToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  helpToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    marginRight: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  hintBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hintTextContainer: {
    flex: 1,
  },
  hintTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  forgotText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#2563EB',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  supportLink: {
    marginTop: 4,
  },
  footerSubText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
    opacity: 0.6
  },
  complianceText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default LoginScreen;