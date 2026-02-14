import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Database,
  Users,
  ShieldCheck,
  Brain,
  Menu,
  X,
  User,
  Bell,
  Settings,
} from 'lucide-react-native';

type AdminDashboardScreenProps = {
  onLogout: () => void;
};

type MenuItem = {
  id: string;
  label: string;
  icon: any;
};

const menuItems: MenuItem[] = [
  { id: 'data', label: 'Data Management', icon: Database },
  { id: 'patients', label: 'Patient Registry', icon: Users },
  { id: 'roles', label: 'Role Management', icon: ShieldCheck },
  { id: 'ai', label: 'AI Configuration', icon: Brain },
];

const AdminDashboardScreen = ({ onLogout }: AdminDashboardScreenProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('data');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleMenuClick = (id: string) => {
    setActiveSection(id);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'data':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            <Text style={styles.sectionDescription}>
              Manage and monitor all system data, databases, and backups.
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>1,234</Text>
                <Text style={styles.statLabel}>Total Records</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>98%</Text>
                <Text style={styles.statLabel}>Data Integrity</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>24</Text>
                <Text style={styles.statLabel}>Active Connections</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>5.2 GB</Text>
                <Text style={styles.statLabel}>Storage Used</Text>
              </View>
            </View>
          </View>
        );
      case 'patients':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Patient Registry</Text>
            <Text style={styles.sectionDescription}>
              View, add, and manage patient records in the system.
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>856</Text>
                <Text style={styles.statLabel}>Total Patients</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>42</Text>
                <Text style={styles.statLabel}>New This Week</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>127</Text>
                <Text style={styles.statLabel}>Active Cases</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Critical Care</Text>
              </View>
            </View>
          </View>
        );
      case 'roles':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Role Management</Text>
            <Text style={styles.sectionDescription}>
              Configure user roles, permissions, and access controls.
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>28</Text>
                <Text style={styles.statLabel}>Doctors</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>64</Text>
                <Text style={styles.statLabel}>Nurses</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Pharmacists</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>5</Text>
                <Text style={styles.statLabel}>Admins</Text>
              </View>
            </View>
          </View>
        );
      case 'ai':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>AI Configuration</Text>
            <Text style={styles.sectionDescription}>
              Configure AI models, prompts, and system behavior.
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>2,847</Text>
                <Text style={styles.statLabel}>AI Requests</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>1.2s</Text>
                <Text style={styles.statLabel}>Avg Response</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>99.8%</Text>
                <Text style={styles.statLabel}>Uptime</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>Active</Text>
                <Text style={styles.statLabel}>Model Status</Text>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navbar */}
      <View style={styles.topNav}>
        <View style={styles.topNavLeft}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Menu size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.appTitle}>CareMind Admin</Text>
        </View>
        <View style={styles.topNavRight}>
          <TouchableOpacity style={styles.navIcon}>
            <Bell size={20} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navIcon}>
            <Settings size={20} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <User size={18} color="#3b82f6" />
            <Text style={styles.profileText}>Admin</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContainer}>
        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={toggleSidebar}
          />
        )}

        {/* Sidebar */}
        <View style={[styles.sidebar, sidebarOpen && styles.sidebarOpen]}>
          <View style={styles.sidebarHeader}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.closeButton}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.sidebarContent}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() => handleMenuClick(item.id)}
                  activeOpacity={0.7}
                >
                  <Icon
                    size={20}
                    color={isActive ? '#3b82f6' : '#64748b'}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.sidebarFooter}>
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content Area */}
        <ScrollView style={styles.contentArea} contentContainerStyle={styles.contentContainer}>
          {renderContent()}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  topNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    padding: 4,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  navIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  profileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 15,
  },
  sidebar: {
    position: 'absolute',
    left: -280,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 20,
  },
  sidebarOpen: {
    left: 0,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    padding: 4,
  },
  sidebarContent: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  menuItemActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  menuTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dc2626',
  },
  contentArea: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  contentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default AdminDashboardScreen;
