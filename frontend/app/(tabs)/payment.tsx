import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView, RefreshControl } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useLocalSearchParams } from 'expo-router';
import { RecentCharges } from '@/components/RecentCharges';

export default function PaymentScreen() {
  const { username } = useLocalSearchParams();
  const { createToken } = useStripe();
  const [cardComplete, setCardComplete] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [key, setKey] = useState(0); // Add a key to force re-render of RecentCharges

  // Add this console.log to debug
  console.log('Payment Screen Username:', username);
  console.log('All params:', useLocalSearchParams());

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Force re-render of RecentCharges by updating its key
    setKey(prevKey => prevKey + 1);
    setRefreshing(false);
  }, []);

  const handlePayPress = async () => {
    try {
      // Check if username exists
      if (!username) {
        console.log('Username is undefined in payment screen');
        Alert.alert('Error', 'Username not found');
        return;
      }

      console.log('Username:', username); // Add this to debug
      console.log('API URL:', `${process.env.EXPO_PUBLIC_API_URL}/users/${username}`);
      
      // Get user_id first
      const userResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/${username}`);
      
      // Log the raw response
      console.log('Raw response:', await userResponse.text());
      
      // Reset the response stream for JSON parsing
      const userData = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/${username}`).then(res => res.json());
      
      if (!userData.success) {
        Alert.alert('Error', 'Could not find user');
        return;
      }

      // Create token
      const { token, error } = await createToken({ type: 'Card' });
      
      console.log('Stripe token:', token);
      console.log('Stripe error:', error);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      if (!token) {
        Alert.alert('Error', 'Something went wrong');
        return;
      }

      // Send token with user_id
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payments/create-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token.id,
          user_id: userData.user_id
        }),
      });

      console.log('Backend response:', await response.clone().text());

      if (!response.ok) {
        console.log('Error response:', await response.text());
        Alert.alert('Error', 'Failed to create customer');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Payment method saved successfully');
      } else {
        Alert.alert('Error', data.error || 'Something went wrong');
      }
    } catch (err) {
      console.error('Payment error:', err);
      Alert.alert('Error', 'Failed to process payment method');
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#333" // Color of the refresh spinner
        />
      }
    >
      <View style={styles.card}>
        <CardField
          postalCodeEnabled={true}
          placeholders={{
            number: '4242 4242 4242 4242',
          }}
          cardStyle={styles.cardField}
          style={styles.cardContainer}
          onCardChange={(cardDetails) => {
            setCardComplete(cardDetails.complete);
          }}
        />
      </View>
      <Button
        onPress={handlePayPress}
        disabled={!cardComplete}
        style={styles.button}
      >
        Save Card
      </Button>

      <RecentCharges key={key} username={username as string} />
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#efefefef',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  cardField: {
    backgroundColor: '#ffffff',
  },
  cardContainer: {
    height: 50,
    marginVertical: 10,
  },
  button: {
    marginBottom: 20,
  },
}); 