# Web3 入门书

当两个人同时收到同一笔数字货币，谁真正收到了钱？从比特币为什么需要共享账本学起，再用一笔测试 ETH 转账串起钱包、签名、哈希、区块、Gas 与共识。接着认识扩容与跨链，动手写合约，最后读懂代币、去中心化金融与链上治理。前四部分按顺序读；工程选读可按兴趣跳读。

## 从一笔交易到共享账本

先弄懂比特币的双花与 UTXO，再用以太坊测试转账认识钱包、哈希、状态、费用、节点和共识。

- [00 · 比特币、双花与共享记账](./01-ethereum-l1/00-bitcoin-and-double-spending.md)
- [01 · 一笔转账怎样被写进区块](./01-ethereum-l1/01-trace-a-transfer.md)
- [02 · 钱包、私钥与交易签名](./01-ethereum-l1/02-wallets-keys-signatures.md)
- [02A · 哈希、区块承诺与 Merkle 证明](./01-ethereum-l1/02a-hashes-and-merkle-proofs.md)
- [03 · 链上状态、执行与 Gas](./01-ethereum-l1/03-state-execution-and-gas.md)
- [04 · 节点、区块与共识](./01-ethereum-l1/04-blocks-and-consensus.md)

## 从 L1 扩容到多链协作

从结算成本和容量出发，分清 Rollup、桥与多链基础设施的职责。

- [05 · 从 L1 拥堵到 Layer 2 Rollup](./02-scaling-and-multichain/05-l1-congestion-to-l2.md)
- [06 · 多链、跨链消息和桥](./02-scaling-and-multichain/06-networks-and-bridges.md)
- [07 · 有了多链背景再读 Layer 0](./02-scaling-and-multichain/07-what-layer-zero-can-mean.md)

## 从第一份合约到可测试的应用

先在 Remix 读写合约，再用 Foundry 部署和测试，从 Fund Me 的同步调用走到 Raffle 的异步回调。

- [08 · 第一个智能合约与 Solidity](./03-contracts-and-foundry/08-first-solidity-contract.md)
- [09 · 数据位置、ABI 与合约之间的调用](./03-contracts-and-foundry/09-contract-composition.md)
- [10 · Foundry 本地循环与第一项测试](./03-contracts-and-foundry/10-local-foundry-loop.md)
- [11 · Fund Me 的 ETH 收付、权限与价格预言机](./03-contracts-and-foundry/11-fund-me-and-price-feeds.md)
- [12 · Fund Me 的部署配置、模拟依赖与测试](./03-contracts-and-foundry/12-testing-external-dependencies.md)
- [13 · 从网页按钮到钱包确认和合约调用](./03-contracts-and-foundry/13-wallet-to-dapp.md)
- [14 · Raffle 的事件、状态机与异步回调](./03-contracts-and-foundry/14-raffle-async-events.md)

## 从链上资产到协议和 DAO

先分清原生币、代币与稳定币，再看授权、流动性、协议资金流与治理。

- [14A · 原生币、合约代币与稳定币](./04-assets-protocols-and-governance/14a-coins-tokens-and-stablecoins.md)
- [15 · ERC-20 代币、余额与授权](./04-assets-protocols-and-governance/15-erc20-token-accounting.md)
- [16 · ERC-721、NFT 所有权与元数据](./04-assets-protocols-and-governance/16-nft-ownership-and-metadata.md)
- [17 · 从一次兑换读懂流动性池与质押凭证](./04-assets-protocols-and-governance/17-swaps-pools-and-staking.md)
- [18 · 超额抵押稳定币与清算](./04-assets-protocols-and-governance/18-overcollateralized-stablecoin.md)
- [19 · 从资金流读懂协议指标和代币激励](./04-assets-protocols-and-governance/19-reading-project-metrics.md)
- [20 · 治理基础：权限、票权与提案](./04-assets-protocols-and-governance/20-governance-before-dao.md)
- [21 · DAO 实践：让 Governor 与时间锁更新 Box](./04-assets-protocols-and-governance/21-dao-with-governor.md)

## 工程选读

按主题挑读。每章开头列出实际用到的前置知识。

- [22 · 签名与 Merkle 证明：空投资格验证](./05-optional-projects/22-merkle-airdrop-signatures.md)
- [23 · 从存储和 ABI 到 UUPS 代理升级](./05-optional-projects/23-storage-abi-and-uups.md)
- [24 · 跨链实践：CCIP 与 Rebase 代币](./05-optional-projects/24-ccip-rebase-project.md)
- [25 · 账户抽象：Ethereum 与 ZKsync 两种路径](./05-optional-projects/25-account-abstraction.md)
- [26 · 不变量测试与防御性审阅](./05-optional-projects/26-invariants-and-defensive-review.md)
