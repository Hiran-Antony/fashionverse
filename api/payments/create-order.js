import Razorpay from 'razorpay';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing orderId or amount' 
      });
    }

    // Initialize Razorpay Instance using keys from environment variables
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });

    // Convert amount in INR to paise (e.g. 500.50 INR -> 50050 paise)
    const amountInPaise = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderId, // Unique receipt identifier
      notes: {
        supabase_order_id: orderId // Attach Supabase order metadata
      }
    };

    // Call Razorpay API to generate the order
    const rzpOrder = await razorpay.orders.create(options);

    console.log(`[Vercel Serverless] Razorpay order created successfully for Supabase Order ID: ${orderId}. Razorpay Order ID: ${rzpOrder.id}`);

    // Return order details and key_id to the frontend
    return res.status(200).json({
      success: true,
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('[Vercel Serverless] Error creating Razorpay order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create Razorpay payment order',
      error: error.message
    });
  }
}
