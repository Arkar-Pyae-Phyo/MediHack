import { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import RoleHeader from '../components/RoleHeader';
import drugOrders from '../sample_data/drug_clean.json';

type MedicationOrder = {
  patientId: string;
  timestamp: string;
  orderId: string;
  medicationName: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  quantity: number;
  prescribedBy: string;
  indication: string;
  instructions: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
};

export type PharmacistPatient = {
  id: string;
  name: string;
  age: number;
  room: string;
  condition: string;
  priority: 'high' | 'medium' | 'low';
  renalFunction: string;
  allergies: string[];
};

const medicationOrders = drugOrders as MedicationOrder[];

const isActiveStatus = (status?: string | null) => {
  if (!status) return false;
  return status.toLowerCase().includes('active');
};

const activeMedicationCounts = medicationOrders.reduce<Record<string, number>>((acc, order) => {
  if (isActiveStatus(order.status)) {
    acc[order.patientId] = (acc[order.patientId] ?? 0) + 1;
  }
  return acc;
}, {});

const getActiveMedicationCount = (patientId: string) => activeMedicationCounts[patientId] ?? 0;

const pharmacistPatients: PharmacistPatient[] = [
  {
    id: 'an1',
    name: 'John Smith',
    age: 68,
    room: '301A',
    condition: 'Acute bronchitis with pneumonia watch',
    priority: 'high',
    renalFunction: 'eGFR 42 mL/min',
    allergies: ['Penicillin'],
  },
  {
    id: 'an2',
    name: 'Maria Garcia',
    age: 57,
    room: '302C',
    condition: 'Atrial fibrillation with hypertension',
    priority: 'medium',
    renalFunction: 'eGFR 58 mL/min',
    allergies: ['Sulfa'],
  },
  {
    id: 'an3',
    name: 'David Lee',
    age: 61,
    room: '305B',
    condition: 'Acute gastroenteritis / infection risk',
    priority: 'low',
    renalFunction: 'eGFR 80 mL/min',
    allergies: ['None reported'],
  },
];

const getPriorityColor = (priority: PharmacistPatient['priority']) => {
  switch (priority) {
    case 'high':
      return '#c026d3';
    case 'medium':
      return '#eab308';
    default:
      return '#14b8a6';
  }
};

const getPriorityBgColor = (priority: PharmacistPatient['priority']) => {
  switch (priority) {
    case 'high':
      return '#fae8ff';
    case 'medium':
      return '#fef9c3';
    default:
      return '#ccfbf1';
  }
};

type PharmacistPatientSelectScreenProps = {
  onLogout: () => void;
  onSelectPatient: (patient: PharmacistPatient) => void;
};

const PharmacistPatientSelectScreen = ({ onLogout, onSelectPatient }: PharmacistPatientSelectScreenProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = useMemo(
    () =>
      pharmacistPatients.filter((patient) => {
        const query = searchQuery.toLowerCase();
        return (
          patient.name.toLowerCase().includes(query) ||
          patient.id.toLowerCase().includes(query) ||
          patient.room.toLowerCase().includes(query) ||
          patient.condition.toLowerCase().includes(query)
        );
      }),
    [searchQuery]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Patient</Text>
            <Text style={styles.subtitle}>Tap to load the medication profile</Text>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, ID, room, or condition..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.patientList}>
            {filteredPatients.map((patient) => {
              const activeMedCount = getActiveMedicationCount(patient.id);
              return (
                <TouchableOpacity
                  key={patient.id}
                  style={styles.patientCard}
                  onPress={() => onSelectPatient(patient)}
                  activeOpacity={0.75}
                >
                  <View style={styles.patientHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.patientName}>{patient.name}</Text>
                      <Text style={styles.patientMeta}>
                        {patient.age} yrs • Room {patient.room} • ID {patient.id}
                      </Text>
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityBgColor(patient.priority) }]}>
                      <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(patient.priority) }]} />
                      <Text style={[styles.priorityText, { color: getPriorityColor(patient.priority) }]}>
                        {patient.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="medical" size={16} color="#64748b" />
                    <Text style={styles.detailText}>{patient.condition}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="water" size={16} color="#64748b" />
                    <Text style={styles.detailText}>{patient.renalFunction}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="warning" size={16} color="#64748b" />
                    <Text style={styles.detailText}>Allergies: {patient.allergies.join(', ')}</Text>
                  </View>

                  <View style={styles.patientFooter}>
                    <Text style={styles.viewText}>Review {activeMedCount} medications</Text>
                    <Ionicons name="arrow-forward" size={18} color="#7c3aed" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {filteredPatients.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="flask-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No medication profiles found</Text>
              <Text style={styles.emptySubtext}>Adjust your filters to see more patients</Text>
            </View>
          )}
        </ScrollView>
        <RoleHeader role="Pharmacist" onLogout={onLogout} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4c1d95',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: '#6d28d9',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  patientList: {
    gap: 12,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  patientMeta: {
    fontSize: 14,
    color: '#64748b',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
  },
  patientFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  viewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
});

export default PharmacistPatientSelectScreen;
