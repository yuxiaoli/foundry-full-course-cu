# Web3 入门书写作进度

工作基准为本机 `develop` 上的 [全书大纲](../../planning/beginner/outline.md)、[逐章来源](../../planning/beginner/source-map.md) 和 [分组提示词](../../prompts/beginner/README.md)。26 章已完成正文、配图、交叉链接和统一审稿。每章的完成状态记录如下。

## 进度清单

| 章 | 规划正文 | 状态 | 待办 |
| --- | --- | --- | --- |
| 01 | [一笔转账怎样被写进区块](./01-ethereum-l1/01-trace-a-transfer.md) | 已完成 | 无 |
| 02 | [钱包、私钥与交易签名](./01-ethereum-l1/02-wallets-keys-signatures.md) | 已完成 | 无 |
| 03 | [链上状态、执行与 Gas](./01-ethereum-l1/03-state-execution-and-gas.md) | 已完成 | 无 |
| 04 | [节点、区块与共识](./01-ethereum-l1/04-blocks-and-consensus.md) | 已完成 | 无 |
| 05 | [从 L1 拥堵到 Layer 2 Rollup](./02-scaling-and-multichain/05-l1-congestion-to-l2.md) | 已完成 | 无 |
| 06 | [多链、跨链消息和桥](./02-scaling-and-multichain/06-networks-and-bridges.md) | 已完成 | 无 |
| 07 | [有了多链背景再读 Layer 0](./02-scaling-and-multichain/07-what-layer-zero-can-mean.md) | 已完成 | 无 |
| 08 | [第一个智能合约与 Solidity](./03-contracts-and-foundry/08-first-solidity-contract.md) | 已完成 | 无 |
| 09 | [数据位置、ABI 与合约之间的调用](./03-contracts-and-foundry/09-contract-composition.md) | 已完成 | 无 |
| 10 | [Foundry 本地循环与第一项测试](./03-contracts-and-foundry/10-local-foundry-loop.md) | 已完成 | 无 |
| 11 | [Fund Me 的 ETH 收付、权限与价格预言机](./03-contracts-and-foundry/11-fund-me-and-price-feeds.md) | 已完成 | 无 |
| 12 | [Fund Me 的部署配置、模拟依赖与测试](./03-contracts-and-foundry/12-testing-external-dependencies.md) | 已完成 | 无 |
| 13 | [从网页按钮到钱包确认和合约调用](./03-contracts-and-foundry/13-wallet-to-dapp.md) | 已完成 | 无 |
| 14 | [Raffle 的事件、状态机与异步回调](./03-contracts-and-foundry/14-raffle-async-events.md) | 已完成 | 无 |
| 15 | [ERC-20 代币、余额与授权](./04-assets-protocols-and-governance/15-erc20-token-accounting.md) | 已完成 | 无 |
| 16 | [ERC-721、NFT 所有权与元数据](./04-assets-protocols-and-governance/16-nft-ownership-and-metadata.md) | 已完成 | 无 |
| 17 | [从一次兑换读懂流动性池与质押凭证](./04-assets-protocols-and-governance/17-swaps-pools-and-staking.md) | 已完成 | 无 |
| 18 | [超额抵押稳定币与清算](./04-assets-protocols-and-governance/18-overcollateralized-stablecoin.md) | 已完成 | 无 |
| 19 | [从资金流读懂协议指标和代币激励](./04-assets-protocols-and-governance/19-reading-project-metrics.md) | 已完成 | 无 |
| 20 | [治理基础：权限、票权与提案](./04-assets-protocols-and-governance/20-governance-before-dao.md) | 已完成 | 无 |
| 21 | [DAO 实践：让 Governor 与时间锁更新 Box](./04-assets-protocols-and-governance/21-dao-with-governor.md) | 已完成 | 无 |
| 22 | [签名与 Merkle 证明：空投资格验证](./05-optional-projects/22-merkle-airdrop-signatures.md) | 已完成 | 无 |
| 23 | [从存储和 ABI 到 UUPS 代理升级](./05-optional-projects/23-storage-abi-and-uups.md) | 已完成 | 无 |
| 24 | [跨链实践：CCIP 与 Rebase 代币](./05-optional-projects/24-ccip-rebase-project.md) | 已完成 | 无 |
| 25 | [账户抽象：Ethereum 与 ZKsync 两种路径](./05-optional-projects/25-account-abstraction.md) | 已完成 | 无 |
| 26 | [不变量测试与防御性审阅](./05-optional-projects/26-invariants-and-defensive-review.md) | 已完成 | 无 |

## 共用案例与篇章边界

- **转账 A（01–04）**　同一份虚构以太坊式本地测试账本，链 ID `31337`。小林 `0x00000000000000000000000000000000000000a1` 向小周 `0x00000000000000000000000000000000000000b2` 付 `0.01` 测试 ETH，双方在例中都是无代码的普通账户。占位交易哈希为 `0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`，交易进入区块 `128`，`nonce` 从 `7` 到 `8`，`gasUsed` 为 `21000`，有效 Gas 价格 `2 gwei`，费用 `0.000042 ETH`。小林 `1 → 0.989958`，小周 `0.25 → 0.26`。基础费 `1.5 gwei`，实际小费 `0.5 gwei`。第 04.2 节按访问权限与治理权两轴比较社区捐款、学校器材和多校教材账本。
- **SimpleStorage（08–10）**　同一新部署实例 `retrieve()` 初值 `0`，`store(777)` 后读到 `777`。第二工厂实例保持初值 `0`，继承子例 `store(7)` 读 `12`。
- **Fund Me（11–13）**　章内用 `5 USD` 门槛和 `2000 USD/ETH` 模拟报价。`0.002 ETH` 折 `4 USD` 回退，`0.003 ETH` 折 `6 USD` 可入账。第 12 章另将同一 `0.003 ETH` 输入在 `1000 USD/ETH` 下核对回退。第 13 章先完成新本地实例的读余额 `0` → 钱包确认充值 → 等回执 → 读余额 `0.003 ETH`。
- **DAO 提案（20–21）**　共同使用课程 `testGovernanceUpdatesBox` 的同一提案。目标 `Box.store(777)`，结果 `Box.retrieve()` 为 `777`。`Store 1 in Box` 是夹具描述文本，实际执行目标以 calldata 与断言为准。第 20 章用同一提案讲角色、授权、投票、法定人数和时间锁，第 21 章走读具体编排及执行。课程配置为投票延迟 1 区块、投票期 50,400 区块、提案门槛 0、法定人数比例 4%、时间锁至少 3,600 秒。

## 合并验收结果

26 篇正文及 26 张图均已核对，详见[阅读索引](./README.md)、[配图索引](./figures/README.md)和[验收记录](./VALIDATION.md)。

正文的待办已清零。跨链双分叉、ZKsync Era 和浏览器钱包所需的独立运行环境及复跑边界记在验收记录。
