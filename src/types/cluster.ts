/**
 * Кластерный вид карты.
 *
 * Кластер — группа связных блоков на одном слое: из любого блока кластера
 * можно попасть в любой другой блок кластера, не перемещаясь по высоте.
 *
 * Узел кластера — это «блок на конкретном абсолютном слое» (blockId + layer),
 * поэтому один блок может входить в несколько кластеров и отображать в них
 * разные свои этажи («переходной блок»).
 *
 * Связь внутри кластера — переход `TransitionData`, у которого абсолютные
 * слои обоих концов совпадают (`from_layer === to_layer`, без смены высоты).
 * Вертикальные переходы (смена слоя) кластеры не объединяют.
 */
import type { BlockData, BlockUid, FloorDisplay } from "./block";
import { getFloorDisplayBySlot, getStringByFloorDisplay } from "./block";
import type { TransitionData, TransitionId } from "./transition";

/** Уникальный ключ узла кластера: блок на конкретном абсолютном слое. */
export type ClusterNodeKey = string;

export const clusterNodeKey = (blockId: BlockUid, layer: number): ClusterNodeKey =>
  `${blockId}:${layer}`;

export type ClusterNode = {
  blockId: BlockUid;
  /** Абсолютный слой (он же слой кластера), на котором показан блок. */
  layer: number;
};

export type BlockCluster = {
  /** Индекс кластера в массиве `computeBlockClusters`. */
  id: number;
  /** Абсолютный слой кластера: все его узлы видимы именно на нём. */
  layer: number;
  /** Узлы кластера, отсортированы по blockId. */
  nodes: ClusterNode[];
  /** Внутренние переходы (id переходов), соединяющие узлы кластера. */
  transitionIds: TransitionId[];
};

/** Связь между кластерами через общий («переходной») блок. */
export type ClusterLink = {
  blockId: BlockUid;
  blockName: string;
  /** Кластер с меньшим слоем. */
  fromCluster: number;
  /** Кластер с большим слоем. */
  toCluster: number;
  /** Отображаемый этаж переходного блока в кластере `fromCluster`. */
  fromFloor: string;
  /** Отображаемый этаж переходного блока в кластере `toCluster`. */
  toFloor: string;
};

/** Отображаемый этаж блока на заданном абсолютном слое. */
export const clusterNodeFloorDisplay = (block: BlockData, layer: number): FloorDisplay =>
  getFloorDisplayBySlot(layer - (block.layer ?? 0), block);

/** Строковое представление отображаемого этажа блока на слое (для подписей). */
export const clusterNodeFloorLabel = (block: BlockData, layer: number): string =>
  getStringByFloorDisplay(clusterNodeFloorDisplay(block, layer));

/** Поиск компонент связности с путевой компрессией. */
class UnionFind {
  private readonly parent = new Map<ClusterNodeKey, ClusterNodeKey>();

  add(key: ClusterNodeKey) {
    if (!this.parent.has(key)) this.parent.set(key, key);
  }

  find(key: ClusterNodeKey): ClusterNodeKey {
    const parent = this.parent.get(key);
    if (parent === undefined || parent === key) return key;
    const root = this.find(parent);
    this.parent.set(key, root);
    return root;
  }

  union(a: ClusterNodeKey, b: ClusterNodeKey) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) this.parent.set(rootB, rootA);
  }

  keys(): IterableIterator<ClusterNodeKey> {
    return this.parent.keys();
  }
}

/**
 * Вычисляет кластеры блоков: компоненты связности узлов «блок + слой»,
 * соединённых переходами без смены высоты.
 *
 * Узлы без переходов (блок виден на слое, но ни с кем не соединён на нём)
 * в кластеры не входят — одиночные панели не несут информации.
 * Кластеры отсортированы по слою, затем по минимальному blockId;
 * id кластера — его индекс в этом массиве.
 */
export const computeBlockClusters = (
  blocks: BlockData[],
  transitions: TransitionData[],
): BlockCluster[] => {
  const blockById = new Map<BlockUid, BlockData>();
  for (const block of blocks) blockById.set(block.id, block);

  const unionFind = new UnionFind();
  const edges: { from: ClusterNodeKey; to: ClusterNodeKey; transitionId: TransitionId }[] = [];
  for (const transition of transitions) {
    const from = blockById.get(transition.from_block_id);
    const to = blockById.get(transition.to_block_id);
    if (!from || !to || from.id === to.id) continue;
    const fromLayer = (from.layer ?? 0) + transition.from_floor;
    const toLayer = (to.layer ?? 0) + transition.to_floor;
    // Переход со сменой высоты не объединяет блоки в кластер
    if (fromLayer !== toLayer) continue;
    const fromKey = clusterNodeKey(from.id, fromLayer);
    const toKey = clusterNodeKey(to.id, toLayer);
    unionFind.add(fromKey);
    unionFind.add(toKey);
    unionFind.union(fromKey, toKey);
    edges.push({ from: fromKey, to: toKey, transitionId: transition.id });
  }

  const nodesByRoot = new Map<ClusterNodeKey, ClusterNode[]>();
  for (const key of unionFind.keys()) {
    const root = unionFind.find(key);
    const [blockIdRaw, layerRaw] = key.split(":");
    const node: ClusterNode = {
      blockId: Number(blockIdRaw),
      layer: Number(layerRaw),
    };
    const list = nodesByRoot.get(root);
    if (list) {
      list.push(node);
    } else {
      nodesByRoot.set(root, [node]);
    }
  }

  const transitionIdsByRoot = new Map<ClusterNodeKey, Set<TransitionId>>();
  for (const edge of edges) {
    const root = unionFind.find(edge.from);
    const ids = transitionIdsByRoot.get(root) ?? new Set<TransitionId>();
    ids.add(edge.transitionId);
    transitionIdsByRoot.set(root, ids);
  }

  const clusters: BlockCluster[] = [];
  for (const [root, nodes] of nodesByRoot) {
    nodes.sort((a, b) => a.blockId - b.blockId || a.layer - b.layer);
    clusters.push({
      id: -1,
      layer: nodes[0]!.layer,
      nodes,
      transitionIds: [...(transitionIdsByRoot.get(root) ?? [])].sort((a, b) => a - b),
    });
  }

  clusters.sort((a, b) => a.layer - b.layer || a.nodes[0]!.blockId - b.nodes[0]!.blockId);
  clusters.forEach((cluster, index) => {
    cluster.id = index;
  });
  return clusters;
};

/**
 * Связи между кластерами через общий блок («переходной блок»).
 *
 * Если блок входит в 3 и более кластеров, связи строятся цепочкой по
 * возрастанию слоёв (соседние кластеры), чтобы не перегружать поле.
 */
export const computeClusterLinks = (
  clusters: BlockCluster[],
  blocks: BlockData[],
): ClusterLink[] => {
  const blockById = new Map<BlockUid, BlockData>();
  for (const block of blocks) blockById.set(block.id, block);

  const byBlock = new Map<BlockUid, { clusterId: number; floor: string }[]>();
  for (const cluster of clusters) {
    for (const node of cluster.nodes) {
      const block = blockById.get(node.blockId);
      if (!block) continue;
      const entries = byBlock.get(node.blockId) ?? [];
      entries.push({ clusterId: cluster.id, floor: clusterNodeFloorLabel(block, cluster.layer) });
      byBlock.set(node.blockId, entries);
    }
  }

  const links: ClusterLink[] = [];
  for (const [blockId, entries] of byBlock) {
    if (entries.length < 2) continue;
    const block = blockById.get(blockId);
    if (!block) continue;
    entries.sort(
      (a, b) =>
        clusters[a.clusterId]!.layer - clusters[b.clusterId]!.layer || a.clusterId - b.clusterId,
    );
    for (let i = 0; i < entries.length - 1; i++) {
      const from = entries[i]!;
      const to = entries[i + 1]!;
      links.push({
        blockId,
        blockName: block.name,
        fromCluster: from.clusterId,
        toCluster: to.clusterId,
        fromFloor: from.floor,
        toFloor: to.floor,
      });
    }
  }
  return links;
};
