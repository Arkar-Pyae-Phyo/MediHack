import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { askGemini } from '../services/gemini';

const familyPrompt = `You are communicating with a patient's family.
Explain in compassionate, plain language what the patient's condition is, why the current care plan matters,
and what family members should know or do to support them.
Avoid medical jargon where possible. Keep the tone calm, hopeful, and informative.
`;

const FamilyViewScreen = () => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await askGemini(familyPrompt);
      setSummary(response || 'We do not have any updates yet. Please check back soon.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach Gemini.';
      setError(message);
      setSummary('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchSummary} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Family Update</Text>
        <Text style={styles.subtitle}>A simple guide to how your loved one is doing.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeading}>
          <Text style={styles.cardTitle}>What to Know</Text>
          {loading ? <ActivityIndicator size="small" color="#9333ea" /> : null}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {summary ? <Text style={styles.summaryText}>{summary}</Text> : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Need Support?</Text>
        <Text style={styles.footerBody}>
          Reach out to the care team if you have questions, or visit the family resource center on the first floor for
          more information and comfort items.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4ff',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#4c1d95',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 18,
    color: '#6d28d9',
    textAlign: 'center',
    lineHeight: 26,
  },
  card: {
    backgroundColor: '#fef9ff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#312e81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6d28d9',
  },
  summaryText: {
    fontSize: 20,
    lineHeight: 30,
    color: '#312e81',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  footer: {
    marginTop: 32,
    backgroundColor: '#ede9fe',
    borderRadius: 20,
    padding: 20,
  },
  footerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4c1d95',
    marginBottom: 8,
    textAlign: 'center',
  },
  footerBody: {
    fontSize: 18,
    lineHeight: 28,
    color: '#4338ca',
    textAlign: 'center',
  },
});

export default FamilyViewScreen;
