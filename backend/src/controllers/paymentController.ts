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

    // Create a customer in Stripe
    const customer = await stripe.customers.create({
      source: token,
    });
    console.log('Stripe customer created:', customer.id);

    // Store the customer details in MongoDB
    const userPaymentDetails = new UserPaymentDetails({
      user_id,
      customer_id: customer.id
    });

    await userPaymentDetails.save();
    console.log('User payment details saved');

    res.status(200).json({
      success: true,
      customer_id: customer.id
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
    if (!userPaymentDetails) {
      return res.status(404).json({
        success: false,
        error: 'No payment method found for this user'
      });
    }

    // Create a payment intent with the customer
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(charge_amt * 100), // Convert to cents
      currency: 'cad',
      customer: userPaymentDetails.customer_id,
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