import { keccak256, toUtf8Bytes, AbiCoder } from 'ethers';

/**
 * Polymarket Token ID 计算工具
 * 
 * 计算流程（简化版，用于 Polymarket 二元市场）：
 * 1. conditionId = keccak256(abi.encodePacked(oracle, questionId, 2))
 * 2. collectionId = keccak256(abi.encodePacked(conditionId, indexSet))
 *    - UP: indexSet = 1
 *    - DOWN: indexSet = 2
 * 3. positionId = keccak256(abi.encodePacked(collateral, collectionId))
 * 
 * 注意：99% 情况下应该直接从 Gamma API 获取 token_id
 * 这个工具主要用于离线场景或 API 不可用时的备用
 */

// Polygon USDC.e 地址
const COLLATERAL_TOKEN = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

/**
 * 计算 Collection ID
 * 对于 Polymarket 二元市场，parentCollectionId = 0
 */
function getCollectionId(conditionId: string, indexSet: number): string {
  // parentCollectionId 为 0 时，直接 keccak256
  const abiCoder = AbiCoder.defaultAbiCoder();
  return keccak256(abiCoder.pack(
    ['bytes32', 'uint256'],
    [conditionId, indexSet]
  ));
}

/**
 * 计算 Position ID (Token ID)
 */
function getPositionId(collateral: string, collectionId: string): bigint {
  const abiCoder = AbiCoder.defaultAbiCoder();
  const hash = keccak256(abiCoder.pack(
    ['address', 'bytes32'],
    [collateral, collectionId]
  ));
  return BigInt(hash);
}

/**
 * 从 conditionId 计算 UP 和 DOWN Token IDs
 * 
 * @param conditionId - 从 Gamma API 获取的 condition_id
 * @returns [upTokenId, downTokenId]
 */
export function calculateTokenIds(conditionId: string): {
  upTokenId: string;
  downTokenId: string;
} {
  // 确保 conditionId 格式正确
  if (!conditionId.startsWith('0x')) {
    conditionId = '0x' + conditionId;
  }
  
  // 计算 UP Token ID (indexSet = 1)
  const upCollectionId = getCollectionId(conditionId, 1);
  const upTokenId = getPositionId(COLLATERAL_TOKEN, upCollectionId);
  
  // 计算 DOWN Token ID (indexSet = 2)
  const downCollectionId = getCollectionId(conditionId, 2);
  const downTokenId = getPositionId(COLLATERAL_TOKEN, downCollectionId);
  
  return {
    upTokenId: upTokenId.toString(),
    downTokenId: downTokenId.toString(),
  };
}

/**
 * 验证计算出的 Token ID 是否与 API 返回的一致
 */
export function verifyTokenIds(
  conditionId: string,
  apiUpTokenId: string,
  apiDownTokenId: string
): boolean {
  const calculated = calculateTokenIds(conditionId);
  
  return (
    calculated.upTokenId === apiUpTokenId &&
    calculated.downTokenId === apiDownTokenId
  );
}

/**
 * 格式化 Token ID 为简短显示
 */
export function formatTokenId(tokenId: string): string {
  if (!tokenId || tokenId.length < 16) return tokenId;
  return `${tokenId.slice(0, 8)}...${tokenId.slice(-8)}`;
}
