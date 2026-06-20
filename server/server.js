import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from the root .env file
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors({
  origin: '*', // Modify to your specific frontend URL in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Razorpay-Signature']
}));

// Use express.json with a custom verify function to capture the raw body buffer.
// This is critical because Razorpay's webhook signature verification requires the raw body string,
// and stringifying parsed JSON can alter spacings/format and cause verification to fail.
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Initialize Razorpay Instance using keys from .env
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// Initialize Supabase Client
// We use the service_role key to safely bypass Row Level Security (RLS) for server-to-server operations.
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * 1. POST /api/payments/create-order
 * Creates a new Razorpay Order using Razorpay Orders API
 * Called by frontend checkout before opening the payment modal
 */
app.post('/api/payments/create-order', async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing orderId or amount' 
      });
    }

    // Convert amount in INR to paise (e.g. 500.50 INR -> 50050 paise)
    // We use Math.round to avoid floating point precision issues.
    const amountInPaise = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderId, // Unique receipt identifier (UUID is 36 chars, limit is 40)
      notes: {
        supabase_order_id: orderId // Attach Supabase order metadata
      }
    };

    // Call Razorpay API to generate the order
    const rzpOrder = await razorpay.orders.create(options);

    console.log(`Razorpay order created successfully for Supabase Order ID: ${orderId}. Razorpay Order ID: ${rzpOrder.id}`);

    // Return order details and key_id to the frontend
    return res.status(200).json({
      success: true,
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create Razorpay payment order',
      error: error.message
    });
  }
});

/**
 * 2. POST /api/payments/verify
 * Verifies Razorpay Checkout signature using HMAC-SHA256
 * Called by frontend handler callback upon successful payment
 */
app.post('/api/payments/verify', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      orderId 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required validation signatures or order identifier'
      });
    }

    // Validate the payment signature
    // The signature is a SHA256 HMAC of (razorpay_order_id + '|' + razorpay_payment_id) using the key secret
    const crypto = await import('crypto');
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    const isValid = generated_signature === razorpay_signature;

    if (!isValid) {
      console.warn(`Signature verification failed for Order ID: ${orderId}`);
      return res.status(400).json({
        success: false,
        message: 'Payment signature verification failed. Transaction might be fraudulent.'
      });
    }

    console.log(`Signature verified successfully for Supabase Order: ${orderId}`);

    // Update Supabase Database order status to 'confirmed' (paid) and store payment reference
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature
      })
      .eq('id', orderId)
      .select();

    if (error) {
      throw error;
    }

    console.log(`Database updated: Order ID ${orderId} marked as confirmed.`);

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      order: data[0]
    });

  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during payment signature verification',
      error: error.message
    });
  }
});

/**
 * 3. POST /webhook
 * Listens for Razorpay Webhook events (payment.captured, payment.failed, order.paid)
 * Verifies authenticity using HMAC-SHA256 signatures before parsing payload
 */
app.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature) {
      return res.status(400).send('Missing X-Razorpay-Signature header');
    }

    // Verify webhook signature with raw payload
    const isValid = Razorpay.validateWebhookSignature(
      req.rawBody.toString(),
      signature,
      webhookSecret
    );

    if (!isValid) {
      console.warn('Invalid webhook signature received');
      return res.status(400).send('Webhook signature verification failed');
    }

    const { event, payload } = req.body;
    console.log(`Verified Webhook Received Event: ${event}`);

    // Extract Order Entities
    const orderEntity = payload.order ? payload.order.entity : null;
    const paymentEntity = payload.payment ? payload.payment.entity : null;

    // Retrieve Supabase Order ID from metadata fields (notes or receipt ID)
    let supabaseOrderId = null;
    if (orderEntity?.notes?.supabase_order_id) {
      supabaseOrderId = orderEntity.notes.supabase_order_id;
    } else if (paymentEntity?.notes?.supabase_order_id) {
      supabaseOrderId = paymentEntity.notes.supabase_order_id;
    } else if (orderEntity?.receipt?.startsWith('receipt_order_')) {
      supabaseOrderId = orderEntity.receipt.replace('receipt_order_', '');
    }

    if (!supabaseOrderId) {
      console.log('Supabase Order ID not found in webhook payload. Skipping database updates.');
      return res.status(200).json({ status: 'ignored', message: 'No supabase order ID found' });
    }

    // Handle Payment Capture / Order Paid Events
    if (event === 'payment.captured' || event === 'order.paid') {
      const razorpayOrderId = orderEntity?.id || paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      console.log(`Processing successful payment for order ${supabaseOrderId}. Razorpay Payment ID: ${razorpayPaymentId}`);

      // Perform DB updates in Supabase
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId
        })
        .eq('id', supabaseOrderId);

      if (error) {
        console.error('Error updating order on webhook captured event:', error);
        throw error;
      }
      
      console.log(`Supabase Order ${supabaseOrderId} updated via Webhook to confirmed.`);
    }

    // Handle Payment Failed Event
    if (event === 'payment.failed') {
      console.log(`Processing failed payment webhook for order ${supabaseOrderId}.`);

      // Update Supabase Order to 'cancelled' on payment failure
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled'
        })
        .eq('id', supabaseOrderId);

      if (error) {
        console.error('Error updating order on webhook failed event:', error);
        throw error;
      }
      
      console.log(`Supabase Order ${supabaseOrderId} marked as cancelled/failed via Webhook.`);
    }

    // Respond with 200 OK to acknowledge receipt of event
    return res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook handling error:', error);
    return res.status(500).json({ status: 'error', error: error.message });
  }
});

// Start the Express Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  Razorpay Integration Server is running on port ${PORT}`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`  Webhook Endpoint: http://localhost:${PORT}/webhook`);
  console.log(`=======================================================`);
});
