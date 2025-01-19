import { Request, Response } from 'express';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '../models/Transaction';
import config from '../config';

const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2023-08-16'
  });

export const processPayment = async (req: Request, res: Response) => {
  try {
    const { name, user_id, bus_route, charge_amt } = req.body;

    // Validate input
    if (!name || !user_id || !bus_route || !charge_amt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(charge_amt * 100), // Convert to cents
      currency: 'cad',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      description: `Bus fare for route ${bus_route}`
    });

    // Create transaction record
    const transaction = new Transaction({
      name,
      user_id,
      bus_route,
      charge_amt,
      transaction_id: uuidv4(),
      stripe_payment_id: paymentIntent.id
    });

    await transaction.save();

    // Return client secret for frontend to complete payment
    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
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