import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type RoleHeaderProps = {
  role: string;
  onLogout: () => void;
};

const RoleHeader = ({ role, onLogout }: RoleHeaderProps) => {
  return (
    <View style={styles.headerBar}>
      <Text style={styles.roleText}>{role}</Text>
      <TouchableOpacity style={styles.backButton} onPress={onLogout}>
        <Text style={styles.backButtonText}>← Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
});

export default RoleHeader;
