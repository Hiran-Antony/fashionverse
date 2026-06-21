const hre = require("hardhat");

async function main() {
  console.log("Deploying FashionVerse contracts...");

  const Orders = await hre.ethers.getContractFactory("OrdersContract");
  const orders = await Orders.deploy();
  await orders.waitForDeployment();
  console.log("Orders:", await orders.getAddress());

  const Token = await hre.ethers.getContractFactory("FashionToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  console.log("Token:", await token.getAddress());

  const NFT = await hre.ethers.getContractFactory("FashionNFT");
  const nft = await NFT.deploy({ gasLimit: 16000000 });
  await nft.waitForDeployment();
  console.log("NFT:", await nft.getAddress());
}

main().catch(console.error);