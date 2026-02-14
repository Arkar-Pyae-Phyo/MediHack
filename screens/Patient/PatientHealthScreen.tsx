import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Heart, Activity, Droplets, Scale, Info, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react-native';

// --- Mock Data ---
const healthMetrics = [
  {
    id: 'bp',
    label: 'Blood Pressure',
    value: '128/82',
    unit: 'mmHg',
    status: 'Normal',
    color: '#10B981',
    icon: Activity,
    history: [120, 125, 122, 130, 128],
    desc: 'Blood pressure is stable. Keep low sodium intake.',
    trend: 'down',
    changePercent: '-2.3%',
  },
  {
    id: 'hr',
    label: 'Heart Rate',
    value: '72',
    unit: 'bpm',
    status: 'Excellent',
    color: '#F43F5E',
    icon: Heart,
    history: [75, 78, 70, 74, 72],
    desc: 'Resting heart rate is within ideal range.',
    trend: 'down',
    changePercent: '-2.7%',
  },
  {
    id: 'glu',
    label: 'Blood Glucose',
    value: '105',
    unit: 'mg/dL',
    status: 'Slightly High',
    color: '#F59E0B',
    icon: Droplets,
    history: [98, 102, 110, 108, 105],
    desc: 'A bit higher than yesterday. Watch your sugar today.',
    trend: 'down',
    changePercent: '-2.8%',
  },
  {
    id: 'wgt',
    label: 'Weight',
    value: '78.5',
    unit: 'kg',
    status: 'Stable',
    color: '#3B82F6',
    icon: Scale,
    history: [79, 78.8, 78.6, 78.5, 78.5],
    desc: 'Maintained steady weight for 2 weeks.',
    trend: 'stable',
    changePercent: '0%',
  },
];

// --- Components ---
const MetricCard = ({ item }: { item: typeof healthMetrics[0] }) => {
  const renderTrendIndicator = () => {
    if (item.trend === 'up') {
      return <TrendingUp size={14} color="#EF4444" />;
    } else if (item.trend === 'down') {
      return <TrendingDown size={14} color="#10B981" />;
    }
    return null;
  };

  return (
    <TouchableOpacity activeOpacity={0.7} style={styles.card}>
      {/* Header Section */}
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
            <item.icon size={24} color={item.color} strokeWidth={2.5} />
          </View>
          <View>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: item.color }]} />
              <Text style={[styles.cardStatus, { color: item.color }]}>{item.status}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.valueContainer}>
          <Text style={styles.cardValue}>{item.value}</Text>
          <Text style={styles.cardUnit}>{item.unit}</Text>
          <View style={styles.changeContainer}>
            {renderTrendIndicator()}
            <Text style={[styles.changeText, { 
              color: item.trend === 'up' ? '#EF4444' : item.trend === 'down' ? '#10B981' : '#6B7280' 
            }]}>
              {item.changePercent}
            </Text>
          </View>
        </View>
      </View>

      {/* Line Chart Visualization */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartLabel}>Last 5 Readings</Text>
        <View style={styles.chartWrapper}>
          {/* Grid Lines */}
          <View style={styles.gridLines}>
            {[...Array(4)].map((_, i) => (
              <View key={i} style={styles.gridLine} />
            ))}
          </View>
          
          {/* Line Chart */}
          <View style={styles.lineChart}>
            {item.history.map((val, index) => {
              const max = Math.max(...item.history);
              const min = Math.min(...item.history);
              const range = max - min || 1;
              const heightPercent = ((val - min) / range) * 100;
              const height = (heightPercent / 100) * 60;
              
              return (
                <View key={index} style={styles.chartPoint}>
                  {/* Connecting Line */}
                  {index < item.history.length - 1 && (
                    <View style={styles.lineConnector} />
                  )}
                  
                  {/* Data Point */}
                  <View style={[styles.pointContainer, { bottom: height }]}>
                    <View style={[
                      styles.dataPoint,
                      { 
                        backgroundColor: index === item.history.length - 1 ? item.color : item.color + '40',
                        borderColor: item.color,
                      }
                    ]}>
                      {index === item.history.length - 1 && (
                        <View style={[styles.pulseRing, { borderColor: item.color }]} />
                      )}
                    </View>
                  </View>
                  
                  {/* Bar Background */}
                  <View style={[styles.barBackground, { height: height }]} />
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Insight Section */}
      <View style={styles.insightBox}>
        <View style={styles.insightIconBox}>
          <Info size={16} color={item.color} />
        </View>
        <Text style={styles.insightText}>{item.desc}</Text>
      </View>

      {/* View Details Button */}
      <TouchableOpacity style={styles.detailsButton}>
        <Text style={styles.detailsButtonText}>View Details</Text>
        <ChevronRight size={16} color="#9CA3AF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const PatientHealthScreen = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Health</Text>
          <Text style={styles.subtitle}>Today's vital signs & trends</Text>
        </View>
        <View style={styles.dateBox}>
          <Text style={styles.dateText}>Today</Text>
          <Text style={styles.dateFull}>Feb 14, 2026</Text>
        </View>
      </View>

      {/* Quick Stats Summary */}
      <View style={styles.summaryBox}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>All Metrics</Text>
          <Text style={styles.summaryValue}>4</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Normal</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>2</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Attention</Text>
          <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>1</Text>
        </View>
      </View>

      {/* Metrics Cards */}
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {healthMetrics.map((item) => (
          <MetricCard key={item.id} item={item} />
        ))}
        
        {/* Bottom Padding */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  
  // Header Styles
  header: { 
    padding: 24, 
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: { 
    fontSize: 15, 
    color: '#64748B', 
    marginTop: 4,
    fontWeight: '500',
  },
  dateBox: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateFull: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },

  // Summary Box
  summaryBox: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  
  // Content
  content: { 
    padding: 20,
    paddingTop: 12,
  },
  
  // Card Styles
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  
  // Card Header
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: { 
    padding: 12, 
    borderRadius: 14, 
    marginRight: 14,
  },
  cardLabel: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1E293B',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  cardStatus: { 
    fontSize: 13, 
    fontWeight: '600',
  },
  
  // Value Section
  valueContainer: {
    alignItems: 'flex-end',
  },
  cardValue: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  cardUnit: { 
    fontSize: 13, 
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Chart Styles
  chartContainer: { 
    marginBottom: 20,
  },
  chartLabel: { 
    fontSize: 11, 
    color: '#94A3B8', 
    marginBottom: 12, 
    textTransform: 'uppercase', 
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  chartWrapper: {
    height: 80,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  lineChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    gap: 12,
    paddingHorizontal: 4,
  },
  chartPoint: {
    flex: 1,
    height: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  barBackground: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    opacity: 0.3,
  },
  pointContainer: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -5 }],
    alignItems: 'center',
  },
  dataPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    top: -6,
    left: -6,
    opacity: 0.3,
  },
  lineConnector: {
    position: 'absolute',
    right: -6,
    width: 12,
    height: 2,
    backgroundColor: '#CBD5E1',
    top: '50%',
  },

  // Insight Box
  insightBox: { 
    flexDirection: 'row', 
    backgroundColor: '#F8FAFC', 
    padding: 14, 
    borderRadius: 12,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#E2E8F0',
  },
  insightIconBox: {
    marginTop: 2,
  },
  insightText: { 
    fontSize: 13, 
    color: '#475569', 
    flex: 1, 
    lineHeight: 20,
    fontWeight: '500',
  },

  // Details Button
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 10,
    gap: 4,
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
});

export default PatientHealthScreen;