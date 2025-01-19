import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

export default function PaymentScreen() {
  const { createToken } = useStripe();
  const [cardComplete, setCardComplete] = useState(false);

  const handlePayPress = async () => {
    try {
      // Create a payment method
      const { token, error } = await createToken({ type: 'Card' });
      
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      if (!token) {
        Alert.alert('Error', 'Something went wrong');
        return;
      }

      // Here we would send the token to our backend
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payments/create-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Payment method saved successfully');
      } else {
        Alert.alert('Error', data.error || 'Something went wrong');
      }
    } catch (err) {
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