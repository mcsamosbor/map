// repositories/MockBlockRepository.ts
import type { BlockRepository } from "./repo";
import type { BlockData, BlockUid } from "@/types/block";
import type { BlocksStore } from "@/stores/blocks";
import { generateBlocks } from "@/stores/blocks_mock";

export class MockBlockRepository implements BlockRepository {
  private store!: BlocksStore;
  private nextId = 1;
  private readonly initialBlocks?: BlockData[];

  constructor(initialBlocks?: BlockData[]) {
    this.initialBlocks = initialBlocks;
  }

  async init(store: BlocksStore): Promise<void> {
    this.store = store;
    const blocks = this.initialBlocks ?? generateBlocks(500);
    this.store.blocks = blocks;
    this.nextId = Math.max(0, ...blocks.map((b) => b.id)) + 1;
  }

  destroy(): void {
    // нечего очищать
  }

  async addBlock(block: Omit<BlockData, "id">): Promise<BlockData> {
    const newBlock: BlockData = { id: this.nextId++, ...block };
    this.store.blocks.push(newBlock);
    return newBlock;
  }

  async updateBlock(block: BlockData): Promise<void> {
    const index = this.store.blocks.findIndex((b) => b.id === block.id);
    if (index === -1) throw new Error(`Block ${block.id} not found`);
    this.store.blocks[index] = { ...block };
  }

  async deleteBlock(id: BlockUid): Promise<void> {
    const index = this.store.blocks.findIndex((b) => b.id === id);
    if (index === -1) throw new Error(`Block ${id} not found`);
    this.store.blocks.splice(index, 1);
  }
}
