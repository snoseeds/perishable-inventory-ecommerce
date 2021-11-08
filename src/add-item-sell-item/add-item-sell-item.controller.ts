import { Controller, Get, Logger, Param, Post, Req, Res } from '@nestjs/common';
import { AddItemSellItemService } from './add-item-sell-item.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Request, Response } from 'express';
import { JSendResponseDto } from '../domain/dto/jsend-response.dto';
import { Connection } from 'typeorm';
import { SalesBatch } from '../domain/model/sales-batch.entity';
import { GetItemQuantityResponseDto } from '../domain/dto/get-item-quantity-response.dto';
import { JsendBaseConfigRequestDto } from '../domain/dto/jsend-base-config.request.dto';
import { ExpiredDisposal } from '../domain/model/expired-disposal.entity';
import fs = require('fs');
import { join } from 'path'

@Controller()
export class AddItemSellItemController {
    constructor(
        private readonly addItemSellItemervice: AddItemSellItemService,
        private connection: Connection,
    ) { }

    private readonly logger = new Logger(AddItemSellItemService.name);

    @Post(':item/add')
    add(@Param('item') itemName: string, @Req() req: Request, @Res() res: Response) {
        const {
            itemStatus,
            batchStatus,
            itemBatch,
            itemBatchStatus,
            totalUnexpiredItemQuantities,
            useConsistentJsendResp
        } = req.body;
        if (useConsistentJsendResp) {
            return res.status(201).send(
                new JSendResponseDto(
                    "success",
                    201,
                    `Batch quantity has been successfully added to the item, see details in data`,
                    { itemName, itemStatus, totalItemQuantity: totalUnexpiredItemQuantities, batchStatus, itemBatchStatus, itemBatch: {
                        ...itemBatch,
                        batch: {
                            ...itemBatch.batch,
                            expiryTime: Number(itemBatch.batch.expiryTime)
                        }
                    } }
                )
            )
        } else {
            return res.status(201).send({})
        }
    }

    @Post(':item/sell')
    async sell(@Param('item') itemName: string, @Req() req: Request, @Res() res: Response) {
        const { quantity, useConsistentJsendResp } = req.body;
        try {
            await this.connection.transaction(async (transactionEntityManager) => {
                try {
                    const transactionAppService = this.addItemSellItemervice.withTransaction(transactionEntityManager);
                    const resultObj = await transactionAppService.checkIfSalesQuantityIsAvailable(itemName, quantity);
                    if (resultObj.result) {
                        const { item, itemBatchesForThisSale, sumOfItemBatches} = resultObj;
                        const salesBatches: SalesBatch[] = await transactionAppService.sellItems(item, quantity, itemBatchesForThisSale, sumOfItemBatches);
                        if (useConsistentJsendResp) {
                            return res.status(201)
                                .send(new JSendResponseDto("success", 201, "Sales is successful for the item's quantities specified, see details in data",
                                 { sales: salesBatches[0].sales, salesBatches: salesBatches.map(salesBatch => {
                                     delete salesBatch.sales;
                                     return {
                                         ...salesBatch,
                                         batch: {
                                             ...salesBatch.batch,
                                             expiryTime: Number(salesBatch.batch.expiryTime)
                                         }
                                     }
                                    })}));
                        }
                        return res.status(201).send({});
                    }
                    return res.status(400).send(new JSendResponseDto('failed', 400, 'Insufficient inventory for this sale, see item max inventory in data',
                        { itemName, maxQuantityInInventory: resultObj.sumOfItemBatches, time: new Date().toISOString() }));
                } catch (err) { throw err; }
            })
        } catch(err) {
            console.log(err);
            // return res.status(500).send(new JSendResponseDto("failed", 500, "Internal Error", "Contact Deep Consulting Solution"));
        }
    }

    @Get(':item/quantity')
    getItemQuantity(@Param('item') itemName: string, @Req() req: Request, @Res() res: Response) {
        const {
            maxExpiryTime,
            totalUnexpiredItemQuantities
        } = req.body;

        if (JsendBaseConfigRequestDto.getRequestConsistentJsendResp) {
            return res.status(200).send(
                new JSendResponseDto(
                    "success",
                    200,
                    `Retrieved item's unexpired quantities successfully, see details in data`,
                    { quantity: totalUnexpiredItemQuantities, validTill: maxExpiryTime, time: new Date().toISOString() }
                )
            )
        } else {
            return res.status(200).send(new GetItemQuantityResponseDto(
                totalUnexpiredItemQuantities,
                maxExpiryTime
            ))
        }
    }

    @Cron(process.env.MODE == 'TEST' ? CronExpression.EVERY_5_SECONDS : CronExpression.EVERY_DAY_AT_MIDNIGHT)
    @Get('transferExpiredItemBatches')
    async transferExpiredItemBatches(@Req() req: Request, @Res() res: Response) {
        let logTime = '', disposalArchiveDetails = null, message = '';
        try {
            await this.connection.transaction(async (transactionEntityManager) => {
                try {
                    const transactionAppService = this.addItemSellItemervice.withTransaction(transactionEntityManager);
                    const { expiredItemBatches, time } = await transactionAppService.removeExpiredItemBatches();
                    if (expiredItemBatches.length > 0) {
                        const { disposalRecord, expiredDisposalRecords }= await transactionAppService.archiveExpiredBatchItemsToDisposal(expiredItemBatches);
                        message = `Successfully archived removed expired item batches that are less than or equal to '${time}'`;
                        disposalArchiveDetails = {
                            disposalRecord,
                            expiredDisposalRecords
                        };
                    } else {
                        message = `There are no expired item batches to remove that are less than or equal to '${time}'`;
                    }
                    logTime = time;
                } catch (err) { throw err; }
            })
        } catch(err) {
            message = "Error while removing or archiving expired item batches, see details";
            disposalArchiveDetails = err;
        }
        const date = new Date().toISOString();
        const data = { date, message, disposalArchiveDetails };
        fs.writeFileSync(join(__dirname, process.env['EXPIRED_ITEMS_LOG_DIR'], `${date}-${logTime}.json`),
            JSON.stringify(data, null, 2));

        return res.status(200).send(new JSendResponseDto('success', 200, "See data for details", data))
    }
}
