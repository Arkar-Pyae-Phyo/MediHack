import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LogOut } from 'lucide-react-native';

type RoleHeaderProps = {
  role: string;
  onLogout: () => void;
  activeTab?: 'home' | 'dashboard';
  onNavigate?: (tab: 'home' | 'dashboard') => void;
};

const RoleHeader = ({ role, onLogout, activeTab = 'dashboard', onNavigate }: RoleHeaderProps) => {
  return (
    <View style={styles.headerBar}>
      {/* Left - Home */}
      <TouchableOpacity
        style={[
          styles.navButton,
          activeTab === 'home' && styles.activeNavButton,
        ]}
        onPress={() => onNavigate?.('home')}
        activeOpacity={0.7}
      >
        <Text style={styles.navIcon}>🏠</Text>
      </TouchableOpacity>

      {/* Center - Dashboard */}
      <TouchableOpacity
        style={[
          styles.navButton,
          activeTab === 'dashboard' && styles.activeNavButton,
        ]}
        onPress={() => onNavigate?.('dashboard')}
        activeOpacity={0.7}
      >
        <Text style={styles.navIcon}>📊</Text>
      </TouchableOpacity>

      {/* Right - Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onLogout}
        activeOpacity={0.8}
      >
        <LogOut size={20} color="#ef4444" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0f2fe',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  activeNavButton: {
    backgroundColor: '#e0f2fe',
    borderWidth: 2,
    borderColor: '#0284c7',
    shadowColor: '#0284c7',
    shadowOpacity: 0.2,
  },
  navIcon: {
    fontSize: 28,
  },
  logoutButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default RoleHeader;