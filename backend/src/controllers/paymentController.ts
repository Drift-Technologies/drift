import { Request, Response } from 'express';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '../models/Transaction';
import { UserPaymentDetails } from '../models/UserPaymentDetails';
import config from '../config';

const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2023-08-16'
  });

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { token, user_id } = req.body;
    console.log('Received request:', { token, user_id });

    if (!token || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check if user already has a customer ID
    let userPaymentDetails = await UserPaymentDetails.findOne({ user_id });
    let customer;

    if (!userPaymentDetails) {
      // Create a new customer in Stripe
      customer = await stripe.customers.create({
        source: token,
      });
      console.log('New Stripe customer created:', customer.id);

      // Get the default payment method details
      const paymentMethods = await stripe.customers.listSources(
        customer.id,
        { object: 'card', limit: 1 }
      );
      const card = paymentMethods.data[0] as Stripe.Card;

      // Create new user payment details
      userPaymentDetails = new UserPaymentDetails({
        user_id,
        customer_id: customer.id,
        payment_methods: [{
          payment_method_id: card.id,
          last4: card.last4,
          brand: card.brand,
        }],
        default_payment_method_id: card.id
      });
    } else {
      // Add new payment method to existing customer
      const newCard = await stripe.customers.createSource(
        userPaymentDetails.customer_id,
        { source: token }
      );
      console.log('Added new card to customer:', newCard.id);

      // Add the new payment method to the array
      userPaymentDetails.payment_methods.push({
        payment_method_id: (newCard as Stripe.Card).id,
        last4: (newCard as Stripe.Card).last4,
        brand: (newCard as Stripe.Card).brand,
      });

      // Set as default if it's the first card or explicitly requested
      if (!userPaymentDetails.default_payment_method_id) {
        userPaymentDetails.default_payment_method_id = (newCard as Stripe.Card).id;
      }
    }

    await userPaymentDetails.save();
    console.log('User payment details saved');

    res.status(200).json({
      success: true,
      customer_id: userPaymentDetails.customer_id,
      payment_methods: userPaymentDetails.payment_methods,
      default_payment_method_id: userPaymentDetails.default_payment_method_id
    });

  } catch (error) {
    console.error('Detailed payment error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create customer'
    });
  }
};
  
export const processPayment = async (req: Request, res: Response) => {
  try {
    const { user_id, bus_route, charge_amt } = req.body;

    // Validate input
    if (!user_id || !bus_route || !charge_amt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Get customer_id from UserPaymentDetails
    const userPaymentDetails = await UserPaymentDetails.findOne({ user_id });
    if (!userPaymentDetails || !userPaymentDetails.default_payment_method_id) {
      return res.status(404).json({
        success: false,
        error: 'No payment method found for this user'
      });
    }

    // Create a payment intent with the customer's default payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(charge_amt * 100), // Convert to cents
      currency: 'cad',
      customer: userPaymentDetails.customer_id,
      payment_method: userPaymentDetails.default_payment_method_id,
      payment_method_types: ['card'],
      confirm: true,
      off_session: true,
      description: `Bus fare for route ${bus_route}`
    });

    // Create transaction record
    const transaction = new Transaction({
      user_id,
      bus_route,
      charge_amt,
      transaction_id: uuidv4(),
      stripe_payment_id: paymentIntent.id,
      timestamp: new Date()
    });

    await transaction.save();

    res.status(200).json({
      success: true,
      transaction_id: transaction.transaction_id,
      stripe_payment_id: paymentIntent.id
    });

  } catch (error) {
    console.error('Payment error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed',
      details: error instanceof Stripe.errors.StripeError ? error.type : undefined
    });
  }
};

export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    const userPaymentDetails = await UserPaymentDetails.findOne({ user_id });
    if (!userPaymentDetails) {
      return res.status(404).json({
        success: false,
        error: 'No payment methods found for this user'
      });
    }

    res.status(200).json({
      success: true,
      payment_methods: userPaymentDetails.payment_methods,
      default_payment_method_id: userPaymentDetails.default_payment_method_id
    });

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment methods'
    });
  }
};

export const setDefaultPaymentMethod = async (req: Request, res: Response) => {
  try {
    const { user_id, payment_method_id } = req.body;

    if (!user_id || !payment_method_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const userPaymentDetails = await UserPaymentDetails.findOne({ user_id });
    if (!userPaymentDetails) {
      return res.status(404).json({
        success: false,
        error: 'No payment methods found for this user'
      });
    }

    // Verify the payment method exists
    const paymentMethodExists = userPaymentDetails.payment_methods.some(
      method => method.payment_method_id === payment_method_id
    );

    if (!paymentMethodExists) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      });
    }

    // Update the default payment method
    userPaymentDetails.default_payment_method_id = payment_method_id;
    await userPaymentDetails.save();

    res.status(200).json({
      success: true,
      default_payment_method_id: payment_method_id
    });

  } catch (error) {
    console.error('Error setting default payment method:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set default payment method'
    });
  }
}; 