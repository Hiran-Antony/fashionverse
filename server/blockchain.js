import { ethers } from 'ethers';
import { createRequire } from 'module';
import dotenv from 'dotenv';
dotenv.config();

const require = createRequire(import.meta.url);

const OrdersABI = require('../blockchain/artifacts/contracts/OrdersContract.sol/OrdersContract.json').abi;
const TokenABI  = require('../blockchain/artifacts/contracts/FashionToken.sol/FashionToken.json').abi;
const NftABI    = require('../blockchain/artifacts/contracts/FashionNFT.sol/FashionNFT.json').abi;

const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
export const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

export const ordersContract = new ethers.Contract(
  process.env.ORDERS_CONTRACT_ADDRESS,
  OrdersABI,
  signer
);

export const tokenContract = new ethers.Contract(
  process.env.TOKEN_CONTRACT_ADDRESS,
  TokenABI,
  signer
);

export const nftContract = new ethers.Contract(
  process.env.NFT_CONTRACT_ADDRESS,
  NftABI,
  signer
);

export function hashOrder(order) {
  const payload = JSON.stringify({
    id:         order.id,
    user_id:    order.user_id,
    items:      order.items,
    total:      order.total_amount,
    created_at: order.created_at,
  });
  return ethers.keccak256(ethers.toUtf8Bytes(payload));
}

export async function checkConnection() {
  const network = await provider.getNetwork();
  const balance = await provider.getBalance(signer.address);
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Blockchain connected                        ║');
  console.log('║  Network :', network.name, '| chainId:', network.chainId.toString());
  console.log('║  Wallet  :', signer.address);
  console.log('║  Balance :', ethers.formatEther(balance), 'MATIC');
  console.log('╚══════════════════════════════════════════════╝');
}