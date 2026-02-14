import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type RoleOption = {
  key: string;
  label: string;
  description: string;
};

type LoginScreenProps = {
  onLogin: (profile: { name: string; role: string }) => void;
};

const ROLE_OPTIONS: RoleOption[] = [
  { key: 'Patient', label: 'Patient', description: 'Track personal care plans and updates.' },
  { key: 'Doctor', label: 'Doctor', description: 'Review clinical dashboards and actions.' },
  { key: 'Nurse', label: 'Nurse', description: 'Coordinate bedside tasks and vitals.' },
  { key: 'Pharmacist', label: 'Pharmacist', description: 'Monitor medications and safety alerts.' },
  { key: 'Family', label: 'Family', description: 'See friendly updates and guidance.' },
];

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const isDisabled = !name.trim() || !selectedRole;

  const handleSubmit = () => {
    if (isDisabled || !selectedRole) {
      return;
    }
    onLogin({ name: name.trim(), role: selectedRole });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Welcome to CareMind</Text>
        <Text style={styles.subtitle}>Enter your name and choose how you support care today.</Text>

        <Text style={styles.label}>Your name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Jane Doe"
          placeholderTextColor="#cbd5f5"
          style={styles.input}
          autoCapitalize="words"
        />

        <Text style={[styles.label, styles.roleLabel]}>Select your role</Text>
        <View style={styles.rolesContainer}>
          {ROLE_OPTIONS.map((role) => {
            const isActive = selectedRole === role.key;
            return (
              <TouchableOpacity
                key={role.key}
                style={[styles.roleCard, isActive ? styles.roleCardActive : undefined]}
                onPress={() => setSelectedRole(role.key)}
              >
                <View style={[styles.radioOuter, isActive ? styles.radioOuterActive : undefined]}>
                  {isActive ? <View style={styles.radioInner} /> : null}
                </View>
                <View style={styles.roleTextBlock}>
                  <Text style={[styles.roleTitle, isActive ? styles.roleTitleActive : undefined]}>{role.label}</Text>
                  <Text style={styles.roleDescription}>{role.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isDisabled ? styles.submitButtonDisabled : undefined]}
          onPress={handleSubmit}
          disabled={isDisabled}
        >
          <Text style={styles.submitText}>Enter Workspace</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 18,
    color: '#94a3b8',
    lineHeight: 26,
  },
  label: {
    marginTop: 36,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#cbd5f5',
  },
  roleLabel: {
    marginTop: 28,
  },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#f8fafc',
    backgroundColor: '#1e293b',
  },
  rolesContainer: {
    marginTop: 8,
    gap: 12,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#111c2e',
    borderWidth: 1,
    borderColor: '#1f2a3c',
  },
  roleCardActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#0f172a',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  radioOuterActive: {
    borderColor: '#38bdf8',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38bdf8',
  },
  roleTextBlock: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  roleTitleActive: {
    color: '#38bdf8',
  },
  roleDescription: {
    marginTop: 4,
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 32,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#38bdf8',
  },
  submitButtonDisabled: {
    backgroundColor: '#1f2937',
  },
  submitText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
});

export default LoginScreen;
