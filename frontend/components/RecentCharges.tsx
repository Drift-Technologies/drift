import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Transaction {
  bus_route: string;
  timestamp: string;
  charge_amt: number;
}

interface RecentChargesProps {
  username: string;
}

export const RecentCharges: React.FC<RecentChargesProps> = ({ username }) => {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // First get user_id
        console.log('Fetching user data from:', `${process.env.EXPO_PUBLIC_API_URL}/users/${username}`);
        const userResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/${username}`);
        const userData = await userResponse.json();
        
        console.log('User data:', userData);
        
        if (!userData.success) {
          console.error('Could not find user');
          return;
        }

        // Then get transactions
        console.log('Fetching transactions from:', `${process.env.EXPO_PUBLIC_API_URL}/transactions/${userData.user_id}`);
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/transactions/${userData.user_id}`);
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        try {
          const data = JSON.parse(responseText);
          if (data.success) {
            setTransactions(data.transactions);
          }
        } catch (parseError) {
          console.error('JSON Parse error:', parseError);
          console.error('Response text:', responseText);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, [username]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })}, ${date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Rides</Text>
      {transactions.map((transaction, index) => (
        <View key={index} style={styles.transactionItem}>
          <View style={styles.leftContent}>
            <Text style={styles.routeText}>Route {transaction.bus_route}</Text>
            <Text style={styles.timestampText}>{formatDate(transaction.timestamp)}</Text>
          </View>
          <Text style={styles.amountText}>${transaction.charge_amt.toFixed(2)}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 20,
    paddingTop: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  leftContent: {
    flex: 1,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  timestampText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
}); 