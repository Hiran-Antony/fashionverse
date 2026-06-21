// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract OrdersContract {
    
    struct Order {
        string orderId;
        address customer;
        uint256 amount;
        uint256 timestamp;
        string status;
    }

    mapping(string => Order) public orders;
    address public owner;

    event OrderRecorded(
        string orderId,
        address customer,
        uint256 amount,
        uint256 timestamp
    );

    event OrderStatusUpdated(
        string orderId,
        string newStatus,
        uint256 timestamp
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function recordOrder(
        string memory orderId,
        address customer,
        uint256 amount
    ) public onlyOwner {
        orders[orderId] = Order({
            orderId: orderId,
            customer: customer,
            amount: amount,
            timestamp: block.timestamp,
            status: "placed"
        });

        emit OrderRecorded(orderId, customer, amount, block.timestamp);
    }

    function updateStatus(
        string memory orderId,
        string memory newStatus
    ) public onlyOwner {
        orders[orderId].status = newStatus;
        emit OrderStatusUpdated(orderId, newStatus, block.timestamp);
    }

    function getOrder(string memory orderId) 
        public view returns (Order memory) {
        return orders[orderId];
    }
}