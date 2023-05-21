# Hackathon-Core

## Concepts

### Gasless ERC20

[Gasless ERC20](https://github.com/web3oj-hackathon/hackathon-core/blob/main/contracts/erc20/GaslessERC20.sol) is pegged ERC20 with original 
ERC20(or native token AVAX). Since it supports gasless transaction, users can send or approve their gasless tokens without gas fee. Also, they
can swap gasless tokens to original tokens anytime without gas fee.

### GaslessSwap

[GaslessSwap](https://github.com/web3oj-hackathon/hackathon-core/blob/main/contracts/swap/GaslessSwap.sol) makes users swap specific ERC20 tokens
to other ERC20 tokens in Uniswap without gas fee. Since it uses Uniswap pool, we don't need to worry about little liquidity problem. Furthermore, 
user can swap between two tokens without gas fee.

For example, assume that an user swap his/her 2000gMATIC to 3000 gUSDT.

<img width="1576" alt="image" src="https://github.com/web3oj-hackathon/hackathon-core/assets/26502092/b81e84df-39d6-47c5-8b6c-e3ed32a019a9">

1. User approves their gasless ERC20 tokens for swap to GaslessSwap contract. Since it uses gasless tokens, user can approve without gas fee.
2. User requests GaslessSwap contract to swap 2000 gMATICs to gUSDTs.
3. GaslessSwap withdraw user's 2000 gMATIC tokens.
4. GaslessSwap withdraw 2000 gMATIC from gasless MATIC contract. So, it will burn 2000gMATIC tokens and transfer 2000MATIC to GaslessSwap contract.
5. GaslessSwap swaps 2000MATIC to 3000USDT in Uniswap.
6. GaslessSwap deposit 3000USDT to gasless USDT contract. It will mint 3000gUSDT to GaslessSwap contract.
7. GaslessSwap sends 3000gUSDT to user.

### Serving Other Existing DeFi Projects

Like uniswap, you can use gasless ERC20 tokens with any other DeFi projects such as SushiSwap, Curve, and Aave by deploying similar contract.

## Install

You should install all dependencies first. Please don't use yarn instead of npm because of hardhat compatibility problem.

```
npm install
```

## Deploy

### 1. Configuration

You should set environments for deploying contracts. You can make `.env` file to set environments and should fill followings.

```
HACKATHON_RELAYER_URL=
HACKATHON_RPC_URL=
HACKATHON_FORWARDER_ADDRESS=
PRIVATE_KEY=
HACKATHON_RELAYER_URL=
```

### 2. Deploying Gasless ERC20 Registry Contract

You can deploy registry contract by npm script. GaslessERC20Registry is a registry contract that creates 
ERC20-pegged gasless ERC20 contracts.

```
npm run deploy
```

After you deploy registry contract, you should set `HACKATHON_REGISTRY_ADDRESS` environment variable to its address.

```
# set registry contract address in .env file
HACKATHON_REGISTRY_ADDRESS=...
```

### 3. Deploying ERC20 Contract for testing

> ❗ Notice that you should set `--network hackathon` to use other network instead of local chain.

Since it has no ERC20 tokens in local or dev chain, you should deploy ERC20 contract and mint its tokens to your account 
for testing. We provide command for deploying ERC20 contract for testing. This ERC20 contract supports `mint` to public.

```
npx hardhat deploy-erc20 --name Polygon --symbol MATIC
```

You can mint tokens by

```
npx hardhat mint --contract <ERC20_CONTRACT> --target <ADDRESS_TO_GET_TOKENS> --amount <AMOUNT(ether)>
```

### 4. Register ERC20 tokens to registry

You should make gasless token contract by registering original ERC20 tokens to 
[`GaslessERC20Registry`](https://github.com/web3oj-hackathon/hackathon-core/blob/main/contracts/erc20/GaslessERC20Registry.sol) 
contract. Please notice that you should add `--network hackathon` option to use hackathon network.

```
npx hardhat registry --contract <ERC20_CONTRACT>
```

## Commands

### mint

You can mint any ERC20 tokens created by `npx hardhat deploy-erc20` command by following command.

```
npx hardhat mint --contract <ERC20_CONTRACT> --target <ADDRESS_TO_GET_TOKENS> --amount <AMOUNT(ether)>
```

### gasless-send

You can send gasless tokens without gas fee by following command.

```
npx hardhat gasless:send --network hackathon --contract <GASLESS_ERC20_CONTRACT> --to <ACCOUNT_TO_SEND> --amount <AMOUNT(ether)>
```
