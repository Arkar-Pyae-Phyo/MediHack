import { useState } from 'react';
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

type Patient = {
  id: string;
  name: string;
  age: number;
  room: string;
  condition: string;
  priority: 'high' | 'medium' | 'low';
};

const mockPatients: Patient[] = [
  { id: 'P001', name: 'John Smith', age: 68, room: '201A', condition: 'Diabetes Type 2', priority: 'high' },
  { id: 'P002', name: 'Maria Garcia', age: 45, room: '202B', condition: 'Hypertension', priority: 'medium' },
  { id: 'P003', name: 'Robert Chen', age: 72, room: '203A', condition: 'Post-surgical', priority: 'high' },
  { id: 'P004', name: 'Sarah Johnson', age: 55, room: '204C', condition: 'Pneumonia', priority: 'medium' },
  { id: 'P005', name: 'David Lee', age: 61, room: '205A', condition: 'Cardiac monitoring', priority: 'low' },
  { id: 'P006', name: 'Emma Wilson', age: 50, room: '206B', condition: 'Recovery', priority: 'low' },
];

type NursePatientSelectScreenProps = {
  onLogout: () => void;
  onSelectPatient: (patient: Patient) => void;
};

const NursePatientSelectScreen = ({ onLogout, onSelectPatient }: NursePatientSelectScreenProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = mockPatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityColor = (priority: Patient['priority']) => {
    switch (priority) {
      case 'high':
        return '#dc2626';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
    }
  };

  const getPriorityBgColor = (priority: Patient['priority']) => {
    switch (priority) {
      case 'high':
        return '#fee2e2';
      case 'medium':
        return '#fef3c7';
      case 'low':
        return '#d1fae5';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Patient</Text>
            <Text style={styles.subtitle}>{filteredPatients.length} patients assigned</Text>
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
            {filteredPatients.map((patient) => (
              <TouchableOpacity
                key={patient.id}
                style={styles.patientCard}
                onPress={() => onSelectPatient(patient)}
                activeOpacity={0.7}
              >
                <View style={styles.patientHeader}>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{patient.name}</Text>
                    <Text style={styles.patientMeta}>
                      {patient.age} years • ID: {patient.id}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityBgColor(patient.priority) },
                    ]}
                  >
                    <View
                      style={[styles.priorityDot, { backgroundColor: getPriorityColor(patient.priority) }]}
                    />
                    <Text
                      style={[styles.priorityText, { color: getPriorityColor(patient.priority) }]}
                    >
                      {patient.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.patientDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="bed" size={16} color="#64748b" />
                    <Text style={styles.detailText}>Room {patient.room}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="medical" size={16} color="#64748b" />
                    <Text style={styles.detailText}>{patient.condition}</Text>
                  </View>
                </View>

                <View style={styles.patientFooter}>
                  <Ionicons name="arrow-forward" size={18} color="#10b981" />
                  <Text style={styles.viewText}>View Patient</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {filteredPatients.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No patients found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search</Text>
            </View>
          )}
        </ScrollView>
        <RoleHeader role="Nurse" onLogout={onLogout} />
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
    color: '#134e4a',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: '#0f766e',
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
  patientInfo: {
    flex: 1,
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
  patientDetails: {
    gap: 8,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
  },
  patientFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  viewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 6,
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

export default NursePatientSelectScreen;
export type { Patient };
