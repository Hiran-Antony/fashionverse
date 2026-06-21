// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract FashionNFT is ERC721 {
    uint256 public tokenId;
    address public owner;
    mapping(uint256 => string) public productId;

    constructor() ERC721("FashionVerse", "FNV") {
        owner = msg.sender;
    }

    function mintProduct(address to, string calldata pid)
        external returns (uint256) {
        require(msg.sender == owner, "Not authorized");
        tokenId++;
        _mint(to, tokenId);
        productId[tokenId] = pid;
        return tokenId;
    }
}