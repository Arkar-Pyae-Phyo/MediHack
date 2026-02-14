import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';


type PatientStatus = 'stable' | 'improving' | 'critical';

type Patient = {
  id: string;
  name: string;
  mrn: string;
  age: number;
  diagnosis: string;
  status: PatientStatus;
  roomNumber: string;
  lastUpdate: string;
  priority: 'high' | 'medium' | 'low';
};

// Mock patient data
const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Avery Thompson',
    mrn: 'HT-482991',
    age: 61,
    diagnosis: 'Type 2 Diabetes, Hypertension',
    status: 'stable',
    roomNumber: '302',
    lastUpdate: '2026-02-14 08:30',
    priority: 'medium',
  },
  {
    id: '2',
    name: 'Michael Chen',
    mrn: 'HT-482992',
    age: 58,
    diagnosis: 'CHF, Renal Disease',
    status: 'critical',
    roomNumber: '401',
    lastUpdate: '2026-02-14 09:15',
    priority: 'high',
  },
  {
    id: '3',
    name: 'Sarah Johnson',
    mrn: 'HT-482993',
    age: 45,
    diagnosis: 'Pneumonia',
    status: 'improving',
    roomNumber: '205',
    lastUpdate: '2026-02-14 07:45',
    priority: 'low',
  },
  {
    id: '4',
    name: 'Robert Williams',
    mrn: 'HT-482994',
    age: 72,
    diagnosis: 'Post-operative recovery',
    status: 'stable',
    roomNumber: '308',
    lastUpdate: '2026-02-14 10:00',
    priority: 'medium',
  },
  {
    id: '5',
    name: 'Emily Davis',
    mrn: 'HT-482995',
    age: 39,
    diagnosis: 'Asthma Exacerbation',
    status: 'improving',
    roomNumber: '112',
    lastUpdate: '2026-02-14 08:00',
    priority: 'low',
  },
  {
    id: '6',
    name: 'James Martinez',
    mrn: 'HT-482996',
    age: 65,
    diagnosis: 'Acute MI',
    status: 'critical',
    roomNumber: '501',
    lastUpdate: '2026-02-14 09:45',
    priority: 'high',
  },
  {
    id: '7',
    name: 'Linda Brown',
    mrn: 'HT-482997',
    age: 54,
    diagnosis: 'Sepsis',
    status: 'critical',
    roomNumber: '502',
    lastUpdate: '2026-02-14 09:30',
    priority: 'high',
  },
  {
    id: '8',
    name: 'David Wilson',
    mrn: 'HT-482998',
    age: 48,
    diagnosis: 'DVT',
    status: 'stable',
    roomNumber: '215',
    lastUpdate: '2026-02-14 07:30',
    priority: 'medium',
  },
];

const DashboardScreen = ({ onLogout }: { onLogout: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<PatientStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Group patients by status
  const stablePatients = mockPatients.filter(p => p.status === 'stable');
  const improvingPatients = mockPatients.filter(p => p.status === 'improving');
  const criticalPatients = mockPatients.filter(p => p.status === 'critical');

  // Get filtered patients
  const filteredPatients = mockPatients
    .filter(p => selectedGroup === 'all' || p.status === selectedGroup)
    .filter(p => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(query) ||
        p.mrn.toLowerCase().includes(query) ||
        p.roomNumber.includes(query)
      );
    });

  const handleRefresh = useCallback(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handlePatientPress = (patient: Patient) => {
    // TODO: Navigate to patient detail
    console.log('Patient pressed:', patient.name);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const getStatusColor = (status: PatientStatus) => {
    switch (status) {
      case 'stable':
        return '#059669';
      case 'improving':
        return '#0284c7';
      case 'critical':
        return '#dc2626';
    }
  };

  const getStatusBgColor = (status: PatientStatus) => {
    switch (status) {
      case 'stable':
        return '#d1fae5';
      case 'improving':
        return '#dbeafe';
      case 'critical':
        return '#fee2e2';
    }
  };

  const getPriorityIcon = (priority: Patient['priority']) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Hospital Theme */}
          <View style={styles.headerContainer}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.hospitalName}>🏥 Medihack Hospital</Text>
                <Text style={styles.departmentName}>Internal Medicine Ward</Text>
              </View>
            </View>
            
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{mockPatients.length}</Text>
                <Text style={styles.statLabel}>Total Patients</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#dc2626' }]}>
                  {criticalPatients.length}
                </Text>
                <Text style={styles.statLabel}>Critical</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#059669' }]}>
                  {stablePatients.length}
                </Text>
                <Text style={styles.statLabel}>Stable</Text>
              </View>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search name, MRN, or room..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearSearch}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <TouchableOpacity
              style={[
                styles.summaryCard,
                styles.stableCard,
                selectedGroup === 'stable' && styles.selectedCard,
              ]}
              onPress={() => setSelectedGroup(selectedGroup === 'stable' ? 'all' : 'stable')}
              activeOpacity={0.7}
            >
              <View style={styles.summaryTop}>
                <View style={styles.summaryIconContainer}>
                  <Text style={styles.summaryEmoji}>✅</Text>
                </View>
                <View style={styles.summaryNumberBadge}>
                  <Text style={styles.summaryNumber}>{stablePatients.length}</Text>
                </View>
              </View>
              <Text style={styles.summaryLabel}>Stable</Text>
              <Text style={styles.summarySubtext}>Stable Condition</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.summaryCard,
                styles.improvingCard,
                selectedGroup === 'improving' && styles.selectedCard,
              ]}
              onPress={() => setSelectedGroup(selectedGroup === 'improving' ? 'all' : 'improving')}
              activeOpacity={0.7}
            >
              <View style={styles.summaryTop}>
                <View style={styles.summaryIconContainer}>
                  <Text style={styles.summaryEmoji}>📈</Text>
                </View>
                <View style={styles.summaryNumberBadge}>
                  <Text style={styles.summaryNumber}>{improvingPatients.length}</Text>
                </View>
              </View>
              <Text style={styles.summaryLabel}>Improving</Text>
              <Text style={styles.summarySubtext}>Getting Better</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.summaryCard,
                styles.criticalCard,
                selectedGroup === 'critical' && styles.selectedCard,
              ]}
              onPress={() => setSelectedGroup(selectedGroup === 'critical' ? 'all' : 'critical')}
              activeOpacity={0.7}
            >
              <View style={styles.summaryTop}>
                <View style={styles.summaryIconContainer}>
                  <Text style={styles.summaryEmoji}>⚠️</Text>
                </View>
                <View style={styles.summaryNumberBadge}>
                  <Text style={styles.summaryNumber}>{criticalPatients.length}</Text>
                </View>
              </View>
              <Text style={styles.summaryLabel}>Critical</Text>
              <Text style={styles.summarySubtext}>Needs Attention</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Info */}
          {(selectedGroup !== 'all' || searchQuery) && (
            <View style={styles.filterInfo}>
              <View style={styles.filterTextContainer}>
                <Text style={styles.filterIcon}>📋</Text>
                <Text style={styles.filterText}>
                  {filteredPatients.length} {filteredPatients.length === 1 ? 'Patient' : 'Patients'}
                  {selectedGroup !== 'all' && (
                    <>
                      {' • '}
                      {selectedGroup === 'stable' && 'Stable'}
                      {selectedGroup === 'improving' && 'Improving'}
                      {selectedGroup === 'critical' && 'Critical'}
                    </>
                  )}
                  {searchQuery && ` • "${searchQuery}"`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => {
                  setSelectedGroup('all');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.clearFilterText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Patient List */}
          <View style={styles.patientListContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📋 Patient List</Text>
              <View style={styles.listBadge}>
                <Text style={styles.listBadgeText}>{filteredPatients.length}</Text>
              </View>
            </View>
            
            {filteredPatients.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Text style={styles.emptyEmoji}>🔍</Text>
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery 
                    ? 'No Patients Found' 
                    : 'No Patient Data'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery 
                    ? 'Try another search term or clear filters' 
                    : 'No patients in the system yet'}
                </Text>
                {searchQuery && (
                  <TouchableOpacity 
                    style={styles.emptyButton}
                    onPress={clearSearch}
                  >
                    <Text style={styles.emptyButtonText}>Clear Search</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredPatients.map((patient) => (
                <TouchableOpacity
                  key={patient.id}
                  style={styles.patientCard}
                  onPress={() => handlePatientPress(patient)}
                  activeOpacity={0.7}
                >
                  {/* Priority Indicator */}
                  <View 
                    style={[
                      styles.priorityIndicator,
                      { backgroundColor: getStatusColor(patient.status) }
                    ]} 
                  />

                  {/* Patient Header */}
                  <View style={styles.patientHeader}>
                    <View style={styles.patientTitleRow}>
                      <View style={styles.patientIconCircle}>
                        <Text style={styles.patientIcon}>👤</Text>
                      </View>
                      <View style={styles.patientInfo}>
                        <View style={styles.patientNameRow}>
                          <Text style={styles.patientName}>{patient.name}</Text>
                          <Text style={styles.priorityIcon}>
                            {getPriorityIcon(patient.priority)}
                          </Text>
                        </View>
                        <View style={styles.metaRow}>
                          <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>MRN:</Text>
                            <Text style={styles.metaValue}>{patient.mrn}</Text>
                          </View>
                          <Text style={styles.metaDivider}>•</Text>
                          <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Age:</Text>
                            <Text style={styles.metaValue}>{patient.age} years</Text>
                          </View>
                          <Text style={styles.metaDivider}>•</Text>
                          <View style={styles.metaItem}>
                            <Text style={styles.roomIcon}>🛏️</Text>
                            <Text style={styles.metaValue}>{patient.roomNumber}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusBgColor(patient.status) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(patient.status) },
                        ]}
                      >
                        {patient.status === 'stable' && '✓ Stable'}
                        {patient.status === 'improving' && '↑ Improving'}
                        {patient.status === 'critical' && '! Critical'}
                      </Text>
                    </View>
                  </View>

                  {/* Patient Details */}
                  <View style={styles.patientDetails}>
                    <View style={styles.diagnosisContainer}>
                      <Text style={styles.diagnosisIcon}>🩺</Text>
                      <View style={styles.diagnosisContent}>
                        <Text style={styles.diagnosisLabel}>Diagnosis</Text>
                        <Text style={styles.diagnosisText}>{patient.diagnosis}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Last Update */}
                  <View style={styles.patientFooter}>
                    <View style={styles.updateContainer}>
                      <Text style={styles.clockIcon}>🕐</Text>
                      <Text style={styles.updateText}>
                        Updated: {patient.lastUpdate}
                      </Text>
                    </View>
                    <View style={styles.viewButton}>
                      <Text style={styles.viewButtonText}>View Details</Text>
                      <Text style={styles.arrowIcon}>›</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 100,
  },
  
  // Hospital Header
  headerContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0f2fe',
  },
  hospitalName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: 4,
  },
  departmentName: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0f2fe',
  },
  
  // Search Bar
  searchContainer: {
    marginBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    paddingVertical: 0,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  clearIcon: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  
  // Summary Cards
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#0284c7',
    shadowColor: '#0284c7',
    shadowOpacity: 0.25,
  },
  stableCard: {
    backgroundColor: '#d1fae5',
  },
  improvingCard: {
    backgroundColor: '#dbeafe',
  },
  criticalCard: {
    backgroundColor: '#fee2e2',
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryEmoji: {
    fontSize: 24,
  },
  summaryNumberBadge: {
    minWidth: 32,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  summarySubtext: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  
  // Filter Info
  filterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  filterTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  clearFilterButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearFilterText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  
  // Patient List
  patientListContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0369a1',
  },
  listBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  patientIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientIcon: {
    fontSize: 24,
  },
  patientInfo: {
    flex: 1,
  },
  patientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  priorityIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginRight: 4,
  },
  metaValue: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  metaDivider: {
    fontSize: 12,
    color: '#cbd5e1',
    marginHorizontal: 6,
  },
  roomIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  patientDetails: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  diagnosisContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  diagnosisIcon: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 2,
  },
  diagnosisContent: {
    flex: 1,
  },
  diagnosisLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  diagnosisText: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 20,
    fontWeight: '500',
  },
  patientFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  updateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  updateText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '600',
    marginRight: 4,
  },
  arrowIcon: {
    fontSize: 18,
    color: '#0284c7',
    fontWeight: '600',
  },
  
  // Empty State
  emptyState: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0f2fe',
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,   
  },
  emptyButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DashboardScreen;