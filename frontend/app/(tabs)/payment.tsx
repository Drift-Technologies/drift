import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView, RefreshControl } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useLocalSearchParams } from 'expo-router';
import { RecentCharges } from '@/components/RecentCharges';
import { SavedCards } from '@/components/SavedCards';

export default function PaymentScreen() {
  const { username } = useLocalSearchParams();
  const { createToken, createPaymentMethod } = useStripe();
  const [cardComplete, setCardComplete] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [key, setKey] = useState(0);

  // Add this console.log to debug
  console.log('Payment Screen Username:', username);
  console.log('All params:', useLocalSearchParams());

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Force re-render of both components by updating their keys
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

      console.log('Username:', username);
      console.log('API URL:', `${process.env.EXPO_PUBLIC_API_URL}/users/${username}`);
      
      // Get user_id first
      const userResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/${username}`);
      const userData = await userResponse.json();
      
      if (!userData.success) {
        Alert.alert('Error', 'Could not find user');
        return;
      }

      // Create payment method to get card details
      const { paymentMethod, error: paymentMethodError } = await createPaymentMethod({
        paymentMethodType: 'Card'
      });
      
      if (paymentMethodError) {
        Alert.alert('Error', paymentMethodError.message);
        return;
      }

      if (!paymentMethod) {
        Alert.alert('Error', 'Failed to read card details');
        return;
      }

      // Check if card already exists
      const existingCardsResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payments/methods/${userData.user_id}`);
      const existingCardsData = await existingCardsResponse.json();
      
      if (existingCardsData.success && existingCardsData.payment_methods) {
        const cardDetails = paymentMethod.Card;
        if (!cardDetails?.last4 || !cardDetails?.brand) {
          Alert.alert('Error', 'Could not read card details');
          return;
        }

        // At this point TypeScript knows both last4 and brand are defined
        const last4 = cardDetails.last4;
        const brand = cardDetails.brand;

        const isDuplicate = existingCardsData.payment_methods.some(
          (card: { last4: string; brand: string }) => 
            card.last4 === last4 && 
            card.brand.toLowerCase() === brand.toLowerCase()
        );

        if (isDuplicate) {
          Alert.alert('Error', 'This card has already been saved to your account');
          return;
        }
      }

      // Create token for the backend
      const { token, error } = await createToken({ type: 'Card' });
      
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      if (!token) {
        Alert.alert('Error', 'Something went wrong');
        return;
      }

      const cardDetails = paymentMethod.Card;
      if (!cardDetails?.last4 || !cardDetails?.brand) {
        Alert.alert('Error', 'Could not read card details');
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
          user_id: userData.user_id,
          card_details: {
            last4: cardDetails.last4,
            brand: cardDetails.brand
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        Alert.alert('Error', 'Failed to save card');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Card saved successfully');
        // Refresh the saved cards list
        onRefresh();
      } else {
        Alert.alert('Error', data.error || 'Something went wrong');
      }
    } catch (err) {
      console.error('Payment error:', err);
      Alert.alert('Error', 'Failed to save card');
    }
  };

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

      <SavedCards key={`saved-cards-${key}`} username={username as string} onRefresh={onRefresh} />
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