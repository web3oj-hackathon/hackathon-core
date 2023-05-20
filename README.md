# Hackathon-Core

## Concepts

### Gasless ERC20

Gasless ERC20 is pegged ERC20 with original ERC20(or native token AVAX). Since it supports gasless transaction, users can send or approve their 
gasless tokens without gas fee. Also, they can swap gasless tokens to original tokens anytime without gas fee.

### GaslessSwap

GaslessSwap makes users swap specific ERC20 tokens to other ERC20 tokens in Uniswap without gas fee. Since 
it uses Uniswap pool, we don't need to worry about little liquidity problem. Furthermore, user can swap
between two tokens without gas fee.

For example, assume that an user swap his/her 2000gMATIC to 3000 gUSDT.

<img width="1581" alt="image" src="https://github.com/web3oj-hackathon/hackathon-core/assets/26502092/37cb674a-4a09-4490-9558-d2e13e19d70c">

1. User approves their gasless ERC20 tokens for swap to GaslessSwap contract. Since it uses gasless tokens, user can approve without gas fee.
2. User requests GaslessSwap contract to swap 2000 gMATICs to gUSDTs.
3. GaslessSwap withdraw user's 2000 gMATIC tokens.
4. GaslessSwap withdraw 2000 gMATIC from gasless MATIC contract. So, it will burn 2000gMATIC tokens and transfer 2000MATIC to GaslessSwap contract.
5. GaslessSwap swaps 2000MATIC to 3000USDT in Uniswap.
6. GaslessSwap deposit 3000USDT to gasless USDT contract. It will mint 3000gUSDT to GaslessSwap contract.
7. GaslessSwap sends 3000gUSDT to user.

## Install

```
npm install
```

## Deploy

You should set environments for deploying contracts. You can make `.env` file to set environments and should fill followings.

```
HACKATHON_RELAYER_URL=
HACKATHON_RPC_URL=
HACKATHON_FORWARDER_ADDRESS=
PRIVATE_KEY=
HACKATHON_RELAYER_URL=
HACKATHON_REGISTRY_ADDRESS=
```

You can deploy registry contract by npm script. GaslessERC20Registry is a registry contract that creates 
ERC20-pegged gasless ERC20 contracts.

```
npm run deploy
```

## Commands

### gasless-send

```
npx hardhat gasless:send --network hackathon --contract 0x6072A15e370aA985A603C8508A1e23FAB8Ba63e7 --to 0x6072A15e370aA985A603C8508A1e23FAB8Ba63e7 --amount 1
```
