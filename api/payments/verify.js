import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[Vercel Serverless] Supabase environment variables missing');
}
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

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
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    const isValid = generated_signature === razorpay_signature;

    if (!isValid) {
      console.warn(`[Vercel Serverless] Signature verification failed for Order ID: ${orderId}`);
      return res.status(400).json({
        success: false,
        message: 'Payment signature verification failed. Transaction might be fraudulent.'
      });
    }

    console.log(`[Vercel Serverless] Signature verified successfully for Supabase Order: ${orderId}`);

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

    console.log(`[Vercel Serverless] Database updated: Order ID ${orderId} marked as confirmed.`);

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      order: data[0]
    });

  } catch (error) {
    console.error('[Vercel Serverless] Error verifying payment signature:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during payment signature verification',
      error: error.message
    });
  }
}
