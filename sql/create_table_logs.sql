CREATE TABLE contract_logs (
    transactionHash VARCHAR(255) PRIMARY KEY,
    blockNumber BIGINT,
    eventName VARCHAR(255),
    fromAddress VARCHAR(42),
    toAddress VARCHAR(42),
    value NUMERIC
);