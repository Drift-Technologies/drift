import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text } from '@/components/ui/Text';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface PaymentMethod {
  payment_method_id: string;
  last4: string;
  brand: string;
  created_at: string;
}

interface SavedCardsProps {
  username: string;
  onRefresh?: () => void;
}

export const SavedCards: React.FC<SavedCardsProps> = ({ username, onRefresh }) => {
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethod[]>([]);
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = React.useState<string | null>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  const fetchPaymentMethods = React.useCallback(async () => {
    try {
      // First get user_id
      const userResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/${username}`);
      const userData = await userResponse.json();
      
      if (!userData.success) {
        console.error('Could not find user');
        return;
      }

      // Then get payment methods
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payments/methods/${userData.user_id}`);
      const data = await response.json();
      
      if (data.success) {
        setPaymentMethods(data.payment_methods);
        setDefaultPaymentMethodId(data.default_payment_method_id);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  }, [username]);

  React.useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  React.useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const setDefaultCard = async (paymentMethodId: string) => {
    try {
      const userResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/${username}`);
      const userData = await userResponse.json();
      
      if (!userData.success) {
        console.error('Could not find user');
        return;
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payments/set-default`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.user_id,
          payment_method_id: paymentMethodId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setDefaultPaymentMethodId(paymentMethodId);
        setIsExpanded(false);
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (error) {
      console.error('Error setting default card:', error);
    }
  };

  if (paymentMethods.length === 0) {
    return null;
  }

  const defaultCard = paymentMethods.find(method => method.payment_method_id === defaultPaymentMethodId);
  const otherCards = paymentMethods.filter(method => method.payment_method_id !== defaultPaymentMethodId);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Method</Text>
      
      {/* Default Card Header - Always visible */}
      <TouchableOpacity 
        style={styles.dropdownHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.cardInfo}>
          <Text style={styles.cardBrand}>{defaultCard?.brand}</Text>
          <Text style={styles.cardNumber}>•••• {defaultCard?.last4}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <IconSymbol name="chevron.down" size={20} color="#333" />
        </Animated.View>
      </TouchableOpacity>

      {/* Other Cards - Visible when expanded */}
      {isExpanded && (
        <View style={styles.dropdownContent}>
          {otherCards.map((method) => (
            <TouchableOpacity
              key={method.payment_method_id}
              style={styles.cardItem}
              onPress={() => setDefaultCard(method.payment_method_id)}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.cardBrand}>{method.brand}</Text>
                <Text style={styles.cardNumber}>•••• {method.last4}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  dropdownContent: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
    textTransform: 'capitalize',
  },
  cardNumber: {
    fontSize: 16,
    color: '#666',
  },
}); 