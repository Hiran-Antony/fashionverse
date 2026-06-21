import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import {
  ordersContract,
  tokenContract,
  nftContract,
  hashOrder,
  signer,
  checkConnection,
} from './blockchain.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Razorpay-Signature']
}));

app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Connect to Polygon on startup
checkConnection().catch(err => {
  console.error('[Blockchain] Startup connection failed:', err.message);
});

// ── 1. POST /api/payments/create-order ──────────────────────────────────
app.post('/api/payments/create-order', async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    if (!orderId || !amount) {
      return res.status(400).json({ success: false, message: 'Missing orderId or amount' });
    }
    const amountInPaise = Math.round(Number(amount) * 100);
    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_order_${orderId}`,
      notes: { supabase_order_id: orderId }
    });
    return res.status(200).json({
      success: true,
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
});

// ── 2. POST /api/payments/verify ────────────────────────────────────────
app.post('/api/payments/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const isValid = razorpay.utils.validatePaymentVerification(
      { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
      razorpay_signature,
      process.env.RAZORPAY_KEY_SECRET
    );
    if (!isValid) return res.status(400).json({ success: false, message: 'Signature verification failed' });

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'confirmed', razorpay_order_id, razorpay_payment_id, razorpay_signature })
      .eq('id', orderId)
      .select();
    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Payment verified', order: data[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ── 3. POST /webhook ─────────────────────────────────────────────────────
app.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) return res.status(400).send('Missing signature');

    const isValid = Razorpay.validateWebhookSignature(
      req.rawBody.toString(), signature, process.env.RAZORPAY_WEBHOOK_SECRET
    );
    if (!isValid) return res.status(400).send('Invalid signature');

    const { event, payload } = req.body;
    const orderEntity = payload.order ? payload.order.entity : null;
    const paymentEntity = payload.payment ? payload.payment.entity : null;

    let supabaseOrderId = null;
    if (orderEntity?.notes?.supabase_order_id) supabaseOrderId = orderEntity.notes.supabase_order_id;
    else if (paymentEntity?.notes?.supabase_order_id) supabaseOrderId = paymentEntity.notes.supabase_order_id;
    else if (orderEntity?.receipt?.startsWith('receipt_order_')) supabaseOrderId = orderEntity.receipt.replace('receipt_order_', '');

    if (!supabaseOrderId) return res.status(200).json({ status: 'ignored' });

    if (event === 'payment.captured' || event === 'order.paid') {
      await supabase.from('orders').update({
        status: 'confirmed',
        razorpay_order_id: orderEntity?.id || paymentEntity?.order_id,
        razorpay_payment_id: paymentEntity?.id
      }).eq('id', supabaseOrderId);
    }

    if (event === 'payment.failed') {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', supabaseOrderId);
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    return res.status(500).json({ status: 'error', error: error.message });
  }
});

// ── BLOCKCHAIN ENDPOINT 1 — Record order on Polygon ─────────────────────
app.post('/api/orders/record-hash', async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId is required' });
  try {
    const { data: order, error: dbErr } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (dbErr || !order) return res.status(404).json({ error: 'Order not found' });

    const customerWallet = order.wallet_address || signer.address;
    const amountInPaise = BigInt(Math.round(order.total_amount * 100));

    const tx = await ordersContract.recordOrder(orderId, customerWallet, amountInPaise);
    const receipt = await tx.wait(1);

    await supabase.from('orders').update({ chain_tx: tx.hash, chain_verified: true }).eq('id', orderId);

    res.json({ success: true, txHash: tx.hash, blockNumber: receipt.blockNumber,
      polygonUrl: `https://polygonscan.com/tx/${tx.hash}` });
  } catch (err) {
    console.error('[Blockchain] record-hash error:', err.message);
    await supabase.from('chain_retry_queue')
      .insert({ order_id: orderId, action: 'record-hash', error: err.message }).catch(() => {});
    res.json({ success: true, chainError: err.message, note: 'Order saved, blockchain write will retry' });
  }
});

// ── BLOCKCHAIN ENDPOINT 2 — Verify order against Polygon ────────────────
app.get('/api/verify/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    const { data: order, error: dbErr } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (dbErr || !order) return res.status(404).json({ error: 'Order not found' });

    const localHash = hashOrder(order);
    const chainHash = await ordersContract.getOrderHash(orderId);
    const verified = localHash === chainHash;

    await supabase.from('orders').update({ chain_verified: verified }).eq('id', orderId);

    res.json({ orderId, verified, localHash, chainHash,
      txHash: order.chain_tx,
      polygonUrl: `https://polygonscan.com/tx/${order.chain_tx}`,
      warning: verified ? null : 'Order data does not match on-chain record' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── BLOCKCHAIN ENDPOINT 3A — Award loyalty tokens ───────────────────────
app.post('/api/loyalty/award', async (req, res) => {
  const { walletAddress, totalAmount, orderId } = req.body;
  if (!walletAddress) return res.json({ success: true, skipped: true, reason: 'No wallet address' });
  try {
    const tokensToAward = Math.floor(totalAmount / 100);
    if (tokensToAward === 0) return res.json({ success: true, tokensAwarded: 0 });

    const amount = ethers.parseUnits(tokensToAward.toString(), 18);
    const tx = await tokenContract.mint(walletAddress, amount);
    await tx.wait(1);

    await supabase.from('loyalty_transactions')
      .insert({ order_id: orderId, wallet_address: walletAddress, tokens_awarded: tokensToAward, tx_hash: tx.hash })
      .catch(() => {});

    res.json({ success: true, tokensAwarded: tokensToAward, txHash: tx.hash,
      polygonUrl: `https://polygonscan.com/tx/${tx.hash}` });
  } catch (err) {
    console.error('[Blockchain] loyalty award error:', err.message);
    res.json({ success: true, chainError: err.message });
  }
});

// ── BLOCKCHAIN ENDPOINT 3B — Get loyalty token balance ──────────────────
app.get('/api/loyalty/balance/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  try {
    const rawBalance = await tokenContract.balanceOf(walletAddress);
    const balance = parseFloat(ethers.formatUnits(rawBalance, 18));
    res.json({ walletAddress, balance, discountValue: balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── BLOCKCHAIN ENDPOINT 4 — Mint product NFT ────────────────────────────
app.post('/api/products/mint-nft', async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId is required' });
  try {
    const { data: product, error: dbErr } = await supabase.from('products').select('*').eq('id', productId).single();
    if (dbErr || !product) return res.status(404).json({ error: 'Product not found' });

    if (product.nft_token_id) {
      return res.json({ success: true, alreadyMinted: true, tokenId: product.nft_token_id, txHash: product.nft_tx_hash });
    }

    const tx = await nftContract.mintProduct(signer.address, productId);
    const receipt = await tx.wait(1);

    let tokenId = 'unknown';
    for (const log of receipt.logs) {
      try {
        const parsed = nftContract.interface.parseLog(log);
        if (parsed?.name === 'Transfer') { tokenId = parsed.args.tokenId.toString(); break; }
      } catch (_) { continue; }
    }

    await supabase.from('products').update({ nft_token_id: tokenId, nft_tx_hash: tx.hash }).eq('id', productId);

    res.json({ success: true, productId, tokenId, txHash: tx.hash,
      polygonUrl: `https://polygonscan.com/tx/${tx.hash}`,
      opensea: `https://opensea.io/assets/matic/${process.env.NFT_CONTRACT_ADDRESS}/${tokenId}` });
  } catch (err) {
    console.error('[Blockchain] mint-nft error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── BLOCKCHAIN ENDPOINT 5 — Log delivery event ──────────────────────────
app.post('/api/delivery/log-event', async (req, res) => {
  const { orderId, event, driverId } = req.body;
  const VALID_EVENTS = ['picked_up', 'out_for_delivery', 'delivered'];
  if (!orderId || !event || !VALID_EVENTS.includes(event)) {
    return res.status(400).json({ error: 'Invalid orderId or event type' });
  }
  try {
    const timestamp = new Date().toISOString();
    const eventKey = `${orderId}-${event}`;
    const payload = JSON.stringify({ orderId, event, driverId, timestamp });
    const hash = ethers.keccak256(ethers.toUtf8Bytes(payload));

    const tx = await ordersContract.recordOrder(eventKey, hash);
    await tx.wait(1);

    await supabase.from('delivery_events')
      .insert({ order_id: orderId, event_type: event, driver_id: driverId, timestamp, chain_tx: tx.hash })
      .catch(() => {});

    res.json({ success: true, orderId, event, txHash: tx.hash, timestamp,
      polygonUrl: `https://polygonscan.com/tx/${tx.hash}` });
  } catch (err) {
    console.error('[Blockchain] delivery log error:', err.message);
    res.json({ success: true, chainError: err.message });
  }
});

// ── Start server ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  Razorpay Integration Server is running on port ${PORT}`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`  Webhook Endpoint: http://localhost:${PORT}/webhook`);
  console.log(`=======================================================`);
});