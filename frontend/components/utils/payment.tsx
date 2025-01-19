interface PaymentRequest {
  user_id: string;
  bus_route: string;
  charge_amt: number;
}

export const processPayment = async (paymentDetails: PaymentRequest): Promise<boolean> => {
  try {
    const response = await fetch('https://drift-nw.onrender.com/api/payments/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentDetails)
    });

    if (!response.ok) {
      console.error('Payment failed:', await response.text());
      return false;
    }

    const data = await response.json();
    console.log('Payment processed successfully:', data);
    return true;

  } catch (error) {
    console.error('Error processing payment:', error);
    return false;
  }
};

// Example usage:
// const makePayment = async () => {
//   const paymentResult = await processPayment({
//     user_id: "78ca5b3e-e549-4030-bb28-a25a24c15beb",
//     bus_route: "49",
//     charge_amt: 3.50
//   });
//   if (paymentResult) {
//     console.log('Payment successful');
//   } else {
//     console.log('Payment failed');
//   }
// };