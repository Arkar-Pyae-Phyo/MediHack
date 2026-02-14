// C:\Users\Admin\Desktop\medihack\MediHack\screens\Pharmacist\PharmacistDashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, StatusBar, RefreshControl } from 'react-native';
import { Search, Pill, ChevronRight, AlertCircle, Clock, CheckCircle2, LogOut, Shield, Zap, PackageCheck, Users } from 'lucide-react-native';
import { getPatientList } from '../../services/patientService';
import { useNavigation } from '@react-navigation/native';

const PharmacistDashboardScreen = ({ onLogout }: { onLogout: () => void }) => {
  const navigation = useNavigation<any>();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Verified'>('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const list = await getPatientList();
    // Mock Data: จำลองสถานะใบสั่งยา
    const mockData = list.map((an, i) => ({
      an,
      bed: `${(i + 1).toString().padStart(2, '0')}`,
      // AN เลขคู่ = มีรายการยาใหม่ต้องตรวจ
      status: i % 2 === 0 ? 'Pending' : 'Verified',
      newOrders: i % 2 === 0 ? Math.floor(Math.random() * 3) + 1 : 0,
      time: '10:30 AM'
    }));
    setPatients(mockData);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredPatients = patients
    .filter(p => activeFilter === 'All' || p.status === activeFilter)
    .filter(p => p.an.includes(search) || p.bed.includes(search));

  const stats = {
    pending: patients.filter(p => p.status === 'Pending').length,
    verified: patients.filter(p => p.status === 'Verified').length,
    total: patients.length
  };

  const renderCard = ({ item }: { item: any }) => {
    const isPending = item.status === 'Pending';
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('PharmacistPatientConsole', { an: item.an })}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.bedCircle, isPending && styles.bedCirclePending]}>
            <Text style={styles.bedNumber}>{item.bed}</Text>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.taskRow}>
              <View style={[styles.statusDot, isPending ? styles.pendingDot : styles.verifiedDot]} />
              <Text style={styles.taskText}>
                {isPending ? `${item.newOrders} New Orders` : 'All Verified'}
              </Text>
              {isPending && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>REVIEW</Text>
                </View>
              )}
            </View>
            <Text style={styles.anText}>AN {item.an}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <View style={styles.timeContainer}>
            <Clock size={14} color="#94A3B8" strokeWidth={2} />
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
          <ChevronRight size={20} color="#CBD5E1" strokeWidth={2} />
        </View>
      </TouchableOpacity>
    );
  };

  const FilterTab = ({ label, count, isActive, onPress }: any) => (
    <TouchableOpacity 
      style={[styles.filterTab, isActive && styles.filterTabActive]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{label}</Text>
      <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
        <Text style={[styles.countText, isActive && styles.countTextActive]}>{count}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={{flex: 1}}>
          <Text style={styles.title}>Rx Verification</Text>
          <Text style={styles.subtitle}>Pharmacy Department</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <LogOut size={20} color="#FFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.statPending]}>
          <Zap size={24} color="#F59E0B" strokeWidth={2.5} style={{marginBottom: 8}} />
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, styles.statVerified]}>
          <PackageCheck size={24} color="#10B981" strokeWidth={2.5} style={{marginBottom: 8}} />
          <Text style={styles.statNumber}>{stats.verified}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={[styles.statCard, styles.statTotal]}>
          <Users size={24} color="#7C3AED" strokeWidth={2.5} style={{marginBottom: 8}} />
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#94A3B8" strokeWidth={2} />
          <TextInput 
            style={styles.input} 
            placeholder="Search bed or AN..." 
            placeholderTextColor="#CBD5E1"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FilterTab 
          label="All Patients" 
          count={stats.total} 
          isActive={activeFilter === 'All'} 
          onPress={() => setActiveFilter('All')} 
        />
        <FilterTab 
          label="Pending" 
          count={stats.pending} 
          isActive={activeFilter === 'Pending'} 
          onPress={() => setActiveFilter('Pending')} 
        />
        <FilterTab 
          label="Verified" 
          count={stats.verified} 
          isActive={activeFilter === 'Verified'} 
          onPress={() => setActiveFilter('Verified')} 
        />
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#7C3AED" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={filteredPatients}
          renderItem={renderCard}
          keyExtractor={item => item.an}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7C3AED']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Shield size={48} color="#CBD5E1" strokeWidth={1.5} />
              <Text style={styles.emptyText}>No patients found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // Header
  header: { 
    backgroundColor: '#7C3AED',
    padding: 20, 
    paddingTop: 60, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  subtitle: { color: '#E9D5FF', marginTop: 4, fontSize: 14, fontWeight: '600' },
  logoutBtn: { 
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats Cards
  statsContainer: { 
    flexDirection: 'row', 
    padding: 16, 
    gap: 12,
  },
  statCard: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statPending: { 
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  statVerified: { 
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  statTotal: { 
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  statLabel: { 
    fontSize: 11, 
    color: '#64748B', 
    fontWeight: '700', 
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Search
  searchContainer: { paddingHorizontal: 16, marginBottom: 16 },
  searchBox: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    padding: 14, 
    borderRadius: 14, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0F172A', fontWeight: '500' },

  // Filter Tabs
  filterContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    gap: 10, 
    marginBottom: 12,
  },
  filterTab: { 
    flex: 1, 
    flexDirection: 'row',
    backgroundColor: '#FFF', 
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabActive: { 
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  filterTextActive: { color: '#FFF' },
  countBadge: { 
    backgroundColor: '#F1F5F9', 
    paddingHorizontal: 7, 
    paddingVertical: 3, 
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  countText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  countTextActive: { color: '#FFF' },

  // Patient Cards
  listContent: { padding: 16, paddingTop: 8 },
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    padding: 18, 
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  bedCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  bedCirclePending: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  bedNumber: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  cardInfo: { flex: 1 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  taskText: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  urgentBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgentText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  anText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  
  cardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  timeContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: { fontSize: 12, color: '#64748B', fontWeight: '700' },

  // Status Dots
  statusDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5,
  },
  pendingDot: { 
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  verifiedDot: { 
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },

  // Empty State
  emptyState: { 
    alignItems: 'center', 
    marginTop: 80,
  },
  emptyText: { 
    fontSize: 15, 
    color: '#94A3B8', 
    fontWeight: '600', 
    marginTop: 12,
  },
});

export default PharmacistDashboardScreen;