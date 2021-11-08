import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Any, LessThanOrEqual, Repository } from 'typeorm';
import { ItemRepository } from '../repository/item.repository';
import { BatchRepository } from '../repository/batch.repository';
import { SalesRepository } from '../repository/sales.repository';
import { SalesBatchRepository } from '../repository/sales-batch.repository';
import { ItemBatchRepository } from '../repository/item-batch.repository';
import { ExpiredDisposalBatchRepository } from '../repository/expired-disposal-batch.repository';
import { ExpiredDisposalRepository } from '../repository/expired-disposal.repository';
import { Item } from '../domain/model/item.entity';
import { Batch } from '../domain/model/batch.entity';
import { ItemBatch } from '../domain/model/item-batch.entity';
import { SalesBatch } from '../domain/model/sales-batch.entity';
import { ExpiredDisposal } from '../domain/model/expired-disposal.entity';
import { TransactionFor } from 'nest-transact';
import { ModuleRef } from '@nestjs/core';
import { DisposalRepository } from '../repository/disposal.repository';
import { DisposalType } from '../domain/enum/disposal-type.enum';
import { Disposal } from '../domain/model/disposal.entity';

@Injectable()
export class AddItemSellItemService extends TransactionFor<AddItemSellItemService> {

  constructor(
    @InjectRepository(ItemRepository) private readonly itemRepo: ItemRepository,
    @InjectRepository(BatchRepository) private readonly batchRepo: BatchRepository,
    @InjectRepository(ItemBatchRepository) private readonly itemBatchRepo: ItemBatchRepository,
    @InjectRepository(SalesRepository) private readonly salesRepo: SalesRepository,
    @InjectRepository(SalesBatchRepository) private readonly salesBatchRepo: SalesBatchRepository,
    @InjectRepository(ExpiredDisposalRepository) private readonly expiredDisposalRepo: ExpiredDisposalRepository,
    @InjectRepository(ExpiredDisposalBatchRepository) private readonly expiredBatchRepo: ExpiredDisposalBatchRepository,
    @InjectRepository(DisposalRepository) private readonly disposalRepo: DisposalRepository,
    moduleRef: ModuleRef
  ) {
    super(moduleRef)
  }

  async checkIfSalesQuantityIsAvailable(itemName: string, quantityInSale: number): Promise<{ result: boolean, item: Item, itemBatchesForThisSale: ItemBatch[], sumOfItemBatches: number}> {
    try {
      const transaction = true, item: Item = await this.itemRepo.findByName(itemName, transaction);
      const batchesOfItem: ItemBatch[] = await this.itemBatchRepo.findByItemID(item.id);
      const requestProcessingorDeliveryTime = 0; // in milliseconds - this can be changed as necessitated by policy
      const minimumExpiryTimeRequirement = new Date().getTime() + requestProcessingorDeliveryTime;
      const batchesNeededAndLockedForThisSale: ItemBatch[] = [];
      let isSalesPossible: boolean = false, sumOfQuantitiesOfQualifiedBatches = 0;
      let sortedItemBatches = batchesOfItem.sort((iBatch1, iBatch2) => Number(iBatch1.batch.expiryTime) - Number(iBatch2.batch.expiryTime));
      for (let itemBatch of sortedItemBatches) {
        if (Number(itemBatch.batch.expiryTime) >= minimumExpiryTimeRequirement && itemBatch.quantity > 0) {
          // Locking the earliest and qualifying batches to use them for this sale
          const lockedQualifyingItemBatch = await this.itemBatchRepo.findOne(itemBatch.id, { transaction });
          batchesNeededAndLockedForThisSale.push(lockedQualifyingItemBatch);
          sumOfQuantitiesOfQualifiedBatches += lockedQualifyingItemBatch.quantity;
          if (sumOfQuantitiesOfQualifiedBatches >= quantityInSale) {
            isSalesPossible = true;
            break;
          }
        }
      }
      return { result: isSalesPossible, item, itemBatchesForThisSale: batchesNeededAndLockedForThisSale, sumOfItemBatches: sumOfQuantitiesOfQualifiedBatches }
    } catch (err) { throw err; }
  }

  async sellItems(item: Item, quantityInSale: number, batchesNeededAndLockedForThisSale: ItemBatch[], sumOfQuantitiesOfQualifiedBatches: number): Promise<SalesBatch[]> {
    try {
      const transaction = true, len = batchesNeededAndLockedForThisSale.length;
      const lastItemBatchInSale = batchesNeededAndLockedForThisSale[len - 1];
      const itemsRemovedBeforeLastBatch = sumOfQuantitiesOfQualifiedBatches - lastItemBatchInSale.quantity;
      const remainingQuantitiesToBeRemovedFromLastBatch = quantityInSale - itemsRemovedBeforeLastBatch;
      const remainingQuantitiesInLastBatch = lastItemBatchInSale.quantity - remainingQuantitiesToBeRemovedFromLastBatch;
      const newSalesRecord = await this.salesRepo.createNewSale(item, quantityInSale, transaction);
      const newsalesRecordBatches = batchesNeededAndLockedForThisSale.map((itemBatch: ItemBatch) => ({
        sales: newSalesRecord, batch: itemBatch.batch, quantity: itemBatch.quantity
      }));
      newsalesRecordBatches[len - 1].quantity = remainingQuantitiesToBeRemovedFromLastBatch;
      const salesBatchesRecords = await this.salesBatchRepo.save(newsalesRecordBatches, { transaction });
      // All batches except the last will have their remaining quantities to be zero, and will thereby be removed from itemBatches
      if (remainingQuantitiesInLastBatch === 0) {
        await this.itemBatchRepo.remove(batchesNeededAndLockedForThisSale, {transaction})
      } else {
        await this.itemBatchRepo.remove(batchesNeededAndLockedForThisSale.slice(0, len - 1), { transaction });
        batchesNeededAndLockedForThisSale[len - 1].quantity = remainingQuantitiesInLastBatch;
        await this.itemBatchRepo.save(batchesNeededAndLockedForThisSale[len - 1], { transaction });
      }
      return salesBatchesRecords;
    } catch (err) {
      throw err;
    }
  }

  async removeExpiredItemBatches(): Promise<{expiredItemBatches: ItemBatch[], time: string }> {
    try {
      const presentTime = new Date().getTime();
      const transaction = true;
      const expiredBatches = await this.batchRepo.find({
        where: {
          expiryTime: LessThanOrEqual(presentTime)
        },
        transaction
      })
  
      const expiredItemBatches = await this.itemBatchRepo.find({
        where: {
          batch: Any(expiredBatches.map(expiredBatch => expiredBatch.id))
        },
        transaction
      })
      await this.itemBatchRepo.remove(expiredItemBatches, { transaction });
      return {
        expiredItemBatches,
        time: String(presentTime)
      }
    } catch (err) { throw err; }
  }

  async sortExpiredItemBatches(expiredItemBatches: ItemBatch[]): Promise<UniqueItemsToBeDisposed> {
    let uniqueItemsToBeDisposed: UniqueItemsToBeDisposed = new Map();
    for (let itemBatch of expiredItemBatches) {
      const existingUniqueItem = uniqueItemsToBeDisposed.get(JSON.stringify(itemBatch.item));
      if (existingUniqueItem) {
        existingUniqueItem.itemBatches.push({
          batch: itemBatch.batch,
          quantity: itemBatch.quantity
        });
        uniqueItemsToBeDisposed.set(JSON.stringify(itemBatch.item), {
          quantity: itemBatch.quantity + existingUniqueItem.quantity,
          itemBatches: existingUniqueItem.itemBatches
        });
      } else {
        uniqueItemsToBeDisposed.set(JSON.stringify(itemBatch.item), {
          quantity: itemBatch.quantity,
          itemBatches: [
            {
              batch: itemBatch.batch,
              quantity: itemBatch.quantity
            }
          ]
        });
      }
    }
    return uniqueItemsToBeDisposed;
  }

  async archiveExpiredBatchItemsToDisposal(expiredItemBatches: ItemBatch[]): Promise<{disposalRecord: Disposal, expiredDisposalRecords: ExpiredDisposal[]}> {
    try {
      console.log(expiredItemBatches);
      const transaction = true;
      const uniqueItemsToBeDisposed: UniqueItemsToBeDisposed = await this.sortExpiredItemBatches(expiredItemBatches);
      const totalQuantityOfAllExpiredDisposalItems = [...uniqueItemsToBeDisposed].reduce((total, [item, itemBatchesBreakdown]) => {
        total += itemBatchesBreakdown.quantity;
        return total;
      }, 0);
      const disposalRecord = await this.disposalRepo.createNewDisposal(DisposalType.EXPIRED_DISPOSAL, totalQuantityOfAllExpiredDisposalItems);
      const expiredDisposalRecords: ExpiredDisposal[] = [];
      for (let [item, itemBatchesBreakdown] of uniqueItemsToBeDisposed) {
        const expiredDisposalRecord = await this.expiredDisposalRepo.createNewExpiredDisposal(disposalRecord, JSON.parse(item), itemBatchesBreakdown.quantity);

        for (let itemBatch of itemBatchesBreakdown.itemBatches) {
          await this.expiredBatchRepo.createNewExpiredDisposalBatch(expiredDisposalRecord, itemBatch.batch, itemBatch.quantity, transaction)
        }
        expiredDisposalRecords.push(expiredDisposalRecord);
      }
      return { disposalRecord, expiredDisposalRecords };
    } catch (err) {
      throw err;
    }
  }
}

type UniqueItemsToBeDisposed = Map<string, { quantity: number, itemBatches: [ { batch: Batch, quantity: number } ] }>;
