import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useRouter } from 'expo-router';
import { RecentCharges } from '@/components/RecentCharges';
import { useParams } from '@/context/ParamsContext';
import { Button } from '@/components/ui/Button';

export default function PaymentScreen() {
  const { username } = useParams();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [key, setKey] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setKey(prevKey => prevKey + 1);
    setRefreshing(false);
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#333"
        />
      }
    >
      <Button
        style={styles.walletButton}
        onPress={() => router.push('/wallet')}
      >
        Wallet
      </Button>
      <RecentCharges key={`recent-charges-${key}`} username={username as string} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  walletButton: {
    marginBottom: 8,
    width: '100%',
  }
});