import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useLocalSearchParams } from 'expo-router';

export default function PaymentScreen() {
  const { username } = useLocalSearchParams();
  const { createToken } = useStripe();
  const [cardComplete, setCardComplete] = useState(false);

  // Add this console.log to debug
  console.log('Payment Screen Username:', username);
  console.log('All params:', useLocalSearchParams());

  const handlePayPress = async () => {
    try {
      // Check if username exists
      if (!username) {
        console.log('Username is undefined in payment screen');
        Alert.alert('Error', 'Username not found');
        return;
      }

      console.log('Username:', username); // Add this to debug
      console.log('API URL:', `${process.env.EXPO_PUBLIC_API_URL}/api/users/${username}`);
      
      // Get user_id first
      const userResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${username}`);
      
      // Log the raw response
      console.log('Raw response:', await userResponse.text());
      
      // Reset the response stream for JSON parsing
      const userData = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${username}`).then(res => res.json());
      
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
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/payments/create-customer`, {
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
    <View style={styles.container}>
      <Text style={styles.header}>Add Payment Method</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
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
    marginTop: 20,
  },
}); 