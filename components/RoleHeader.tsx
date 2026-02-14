import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LogOut } from 'lucide-react-native';

type RoleHeaderProps = {
  role: string;
  onLogout: () => void;
};

const RoleHeader = ({ role, onLogout }: RoleHeaderProps) => {
  return (
    <View style={styles.headerBar}>
      <View style={styles.roleContainer}>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{role}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={onLogout}
        activeOpacity={0.8}
      >
        <LogOut size={16} color="#ef4444" strokeWidth={2.5} />
        <Text style={styles.backButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  roleContainer: {
    flex: 1,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
  },
  roleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
    letterSpacing: 0.3,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
    letterSpacing: 0.2,
  },
});

export default RoleHeader;
