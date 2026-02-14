import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { LogOut } from 'lucide-react-native';

type BardoctorProps = {
  activeTab: 'home' | 'dashboard';
  onNavigate: (tab: 'home' | 'dashboard') => void;
  onLogout: () => void;
};

const Bardoctor = ({ activeTab, onNavigate, onLogout }: BardoctorProps) => {
  return (
    <View style={styles.headerBar}>
      {/* ปุ่มไปหน้า Home (Chat) */}
      <TouchableOpacity
        style={[
          styles.navButton,
          activeTab === 'home' && styles.activeNavButton,
        ]}
        onPress={() => onNavigate('home')}
      >
        <Text style={styles.navIcon}>🏠</Text>
        <Text style={[styles.navText, activeTab === 'home' && styles.activeNavText]}>แชท AI</Text>
      </TouchableOpacity>

      {/* ปุ่มไปหน้า Dashboard */}
      <TouchableOpacity
        style={[
          styles.navButton,
          activeTab === 'dashboard' && styles.activeNavButton,
        ]}
        onPress={() => onNavigate('dashboard')}
      >
        <Text style={styles.navIcon}>📊</Text>
        <Text style={[styles.navText, activeTab === 'dashboard' && styles.activeNavText]}>รายการ</Text>
      </TouchableOpacity>

      {/* ปุ่ม Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onLogout}
      >
        <LogOut size={20} color="#ef4444" />
        <Text style={styles.logoutText}>ออก</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15, // เผื่อระยะสำหรับ iPhone รุ่นใหม่
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0f2fe',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 15,
  },
  activeNavButton: {
    backgroundColor: '#e0f2fe',
  },
  navIcon: {
    fontSize: 22,
  },
  navText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  activeNavText: {
    color: '#0284c7',
  },
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 2,
  }
});

export default Bardoctor;