import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection, getConnection } from 'typeorm';
import { AddItemSellItemModule } from '../src/add-item-sell-item/add-item-sell-item.module';
import { AddItemSellItemService } from '../src/add-item-sell-item/add-item-sell-item.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { configService } from '../src/config/config.service';
import { Item } from '../src/domain/model/item.entity';
import { Batch } from '../src/domain/model/batch.entity';
import { ItemBatch } from '../src/domain/model/item-batch.entity';
import { SalesBatch } from '../src/domain/model/sales-batch.entity';
import { ExpiredDisposal } from '../src/domain/model/expired-disposal.entity';
import { Subscriber, Subscription } from 'rxjs';
import { ExpiredDisposalRepository } from '../src/repository/expired-disposal.repository';
import { ExpiredDisposalBatchRepository } from '../src/repository/expired-disposal-batch.repository';
import { BatchRepository } from '../src/repository/batch.repository';
import { ItemRepository } from '../src/repository/item.repository';
import { SalesBatchRepository } from '../src/repository/sales-batch.repository';
import { ItemBatchRepository } from '../src/repository/item-batch.repository';
import { SalesRepository } from '../src/repository/sales.repository';
import { DisposalRepository } from '../src/repository//disposal.repository';
import { AllSettledPromiseIndividualResult } from '../src/domain/types/all-settled-promise-individual-result';

import { join } from 'path';
import { ExpiredDisposalBatch } from 'src/domain/model/expired-disposal-batch.entity';
const axios = require('axios');

const glob = require('glob');
const util = require('util');

describe('AddItemSellItemController (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  beforeAll(async () => {
    // Condition to make sure process.env['EXPIRED_ITEMS_LOG_DIR'] isn't pointing to dev or prod folder
      // to prevent mistakenly deleting the event status log files there
    if (process.env.MODE == 'TEST') {
      const logPath = `../src/add-item-sell-item/${process.env['EXPIRED_ITEMS_LOG_DIR']}`;
      const deleleEventLogFilesCommand = `rm ${join(__dirname, logPath, '*')}`;
      try {
        const exec = util.promisify(require('child_process').exec);
        await exec(deleleEventLogFilesCommand);
      } catch (err) {
        console.log(err);
      }
    }
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    await app.init();
    connection = getConnection();
  });

  afterEach(async () => {
    await connection.close();
    await app.close();
  });

  const convertTimeToStrAndSecondsToNumber = (obj) => {
    let returnedObj = {};
    Object.entries(obj).forEach(([key, value]) => {
      if (key.endsWith("DateTime")) {
        returnedObj[key] = Date.prototype.toISOString.call(value);
      } else if (key === "expiryTime") {
        returnedObj[key] = Number(value);
      } else {
        if (typeof value === "object") {
          returnedObj[key] = convertTimeToStrAndSecondsToNumber(value);
        } else {
          returnedObj[key] = value;
        }
      }
    });
    return returnedObj;
  };

  const time1 = new Date().getTime() + 200000;
  const time2 = new Date().getTime() + 190000;

  const item1 = 'apple';
  const item2 = 'greek-yoghurt';
  describe('/:item/add (POST) (e2e)', () => {
    it('Failure: when reqBody is missing required fields', async () => {
      const reqBody =  {};
      const { body } = await request(app.getHttpServer())
        .post(`/${item1}/add`)
        .send(reqBody)
        .expect(400)
      
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 400,
          "message": "Bad request, details are in data",
          "data": [
              {
                  "propertyName": "expiry",
                  "errors": {
                      "isNumber": "expiry must be a number conforming to the specified constraints",
                      "isNotEmpty": "expiry should not be empty"
                  }
              },
              {
                  "propertyName": "quantity",
                  "errors": {
                      "min": "quantity must not be less than 1",
                      "isInt": "quantity must be an integer number",
                      "isNumber": "quantity must be a number conforming to the specified constraints",
                      "isNotEmpty": "quantity should not be empty"
                  }
              }
          ]
        }
      ) 
    });

    it(`failure: quantity's value is less than one`, async () => {
      const reqBody =   {
        expiry: 2957119218481,
        quantity: 0
      };
      const { body } = await request(app.getHttpServer())
        .post(`/${item1}/add`)
        .send(reqBody)
        .expect(400)
      
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 400,
          "message": "Bad request, details are in data",
          "data": [
              {
                  "propertyName": "quantity",
                  "errors": {
                      "min": "quantity must not be less than 1"
                  }
              }
          ]
        }
      ) 
    });

    it(`failure: quantity's value is not an integer`, async () => {
      const reqBody =   {
        expiry: 2957119218481,
        quantity: 5.2
      };
      const { body } = await request(app.getHttpServer())
        .post(`/${item1}/add`)
        .send(reqBody)
        .expect(400)
      
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 400,
          "message": "Bad request, details are in data",
          "data": [
              {
                  "propertyName": "quantity",
                  "errors": {
                      "isInt": "quantity must be an integer number"
                  }
              }
          ]
        }
      ) 
    });

    it(`failure: expiry's time value is passed or isn't enough`, async () => {
      const reqBody =   {
        expiry: 1257119218481,
        quantity: 5
      };
      const { body } = await request(app.getHttpServer())
        .post(`/${item2}/add`)
        .send(reqBody)
        .expect(422)

      const { data } = body;
      expect(data).toHaveProperty("minimumValidExpiryTimeInMS");
      expect(data.minimumValidExpiryTimeInMS).toHaveProperty("asOfTime");
      expect(data.minimumValidExpiryTimeInMS).toHaveProperty("minimumValidExpiryTimeForItem");

      delete body.data.minimumValidExpiryTimeInMS;
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 400,
          "message": "Bad request, expiry time in batch doesn't meet the minimum expected for the item. See details in data",
          "data": {
              "itemName": item2
          }
        }
      ) 
    });

    const firstSuccessfulBatch = time2;
    it(`success: added quantities to item via new item, new batch, and new item batch`, async () => {
      const batchExpiryTime = firstSuccessfulBatch;
      const reqBody =   {
        expiry: batchExpiryTime,
        quantity: 6
      };
      const { body } = await request(app.getHttpServer())
        .post(`/${item2}/add`)
        .send(reqBody)
        .expect(201)
      
      const persistedItemFromDB = await connection.getCustomRepository(ItemRepository).findByName(item2);
      const persistedBatchFromDB = await connection.getCustomRepository(BatchRepository).findByBatchExpiryTime(String(batchExpiryTime));
      const persistedItemBatchFromDB = await connection.getCustomRepository(ItemBatchRepository)
        .findByItemAndBatchID(persistedItemFromDB.id, persistedBatchFromDB.id);

      expect(body).toEqual(
        {
          "status": "success",
          "statusCode": 201,
          "message": "Batch quantity has been successfully added to the item, see details in data",
          "data": {
              "itemName": item2,
              "itemStatus": "Newly created item",
              "totalItemQuantity": 6,
              "batchStatus": "Newly created batch",
              "itemBatch": convertTimeToStrAndSecondsToNumber(persistedItemBatchFromDB),
              "itemBatchStatus": "Newly created item batch"
          }
      }
      ) 
    });

    const batchExpiryTimeForNextThreeCases = time1;
    it(`success: added quantities to item via existing item, new batch, and new item batch`, async () => {
      const batchExpiryTime = batchExpiryTimeForNextThreeCases;
      const reqBody =   {
        expiry: batchExpiryTime,
        quantity: 5
      };
      const { body } = await request(app.getHttpServer())
        .post(`/${item2}/add`)
        .send(reqBody)
        .expect(201)
      
      const persistedItemFromDB = await connection.getCustomRepository(ItemRepository).findByName(item2);
      const persistedBatchFromDB = await connection.getCustomRepository(BatchRepository).findByBatchExpiryTime(String(batchExpiryTime));
      const persistedItemBatchFromDB = await connection.getCustomRepository(ItemBatchRepository)
        .findByItemAndBatchID(persistedItemFromDB.id, persistedBatchFromDB.id);

      expect(body).toEqual(
        {
          "status": "success",
          "statusCode": 201,
          "message": "Batch quantity has been successfully added to the item, see details in data",
          "data": {
              "itemName": item2,
              "itemStatus": "Existing item",
              "totalItemQuantity": 11,
              "batchStatus": "Newly created batch",
              "itemBatch": convertTimeToStrAndSecondsToNumber(persistedItemBatchFromDB),
              "itemBatchStatus": "Newly created item batch"
          }
      }
      ) 
    });

    it(`success: added quantities to item via existing item, existing batch, and existing item batch`, async () => {
      const batchExpiryTime = batchExpiryTimeForNextThreeCases;
      const reqBody =   {
        expiry: batchExpiryTime,
        quantity: 7
      };
      const { body } = await request(app.getHttpServer())
        .post(`/${item2}/add`)
        .send(reqBody)
        .expect(201)
      
      const persistedItemFromDB = await connection.getCustomRepository(ItemRepository).findByName(item2);
      const persistedBatchFromDB = await connection.getCustomRepository(BatchRepository).findByBatchExpiryTime(String(batchExpiryTime));
      const persistedItemBatchFromDB = await connection.getCustomRepository(ItemBatchRepository)
        .findByItemAndBatchID(persistedItemFromDB.id, persistedBatchFromDB.id);

      expect(body).toEqual(
        {
          "status": "success",
          "statusCode": 201,
          "message": "Batch quantity has been successfully added to the item, see details in data",
          "data": {
              "itemName": item2,
              "itemStatus": "Existing item",
              "totalItemQuantity": 18,
              "batchStatus": "Existing batch",
              "itemBatch": convertTimeToStrAndSecondsToNumber(persistedItemBatchFromDB),
              "itemBatchStatus": "Updated existing item batch"
          }
      }
      ) 
    });

    it(`success: added quantities to item via new item, existing batch, and new item batch`, async () => {
      const batchExpiryTime = batchExpiryTimeForNextThreeCases;
      const reqBody =   {
        expiry: batchExpiryTime,
        quantity: 7
      };
      const { body } = await request(app.getHttpServer())
        .post(`/${item1}/add`)
        .send(reqBody)
        .expect(201)
      
      const persistedItemFromDB = await connection.getCustomRepository(ItemRepository).findByName(item1);
      const persistedBatchFromDB = await connection.getCustomRepository(BatchRepository).findByBatchExpiryTime(String(batchExpiryTime));
      const persistedItemBatchFromDB = await connection.getCustomRepository(ItemBatchRepository)
        .findByItemAndBatchID(persistedItemFromDB.id, persistedBatchFromDB.id);

      expect(body).toEqual(
        {
          "status": "success",
          "statusCode": 201,
          "message": "Batch quantity has been successfully added to the item, see details in data",
          "data": {
              "itemName": item1,
              "itemStatus": "Newly created item",
              "totalItemQuantity": 7,
              "batchStatus": "Existing batch",
              "itemBatch": convertTimeToStrAndSecondsToNumber(persistedItemBatchFromDB),
              "itemBatchStatus": "Newly created item batch"
          }
      }
      ) 
    });

    it(`success: added quantities to item via existing item, existing batch, and new item batch`, async () => {
      const batchExpiryTime = firstSuccessfulBatch;
      const reqBody =   {
        expiry: batchExpiryTime,
        quantity: 4
      };
      const { body } = await request(app.getHttpServer())
        .post(`/${item1}/add`)
        .send(reqBody)
        .expect(201)
      
      const persistedItemFromDB = await connection.getCustomRepository(ItemRepository).findByName(item1);
      const persistedBatchFromDB = await connection.getCustomRepository(BatchRepository).findByBatchExpiryTime(String(batchExpiryTime));
      const persistedItemBatchFromDB = await connection.getCustomRepository(ItemBatchRepository)
        .findByItemAndBatchID(persistedItemFromDB.id, persistedBatchFromDB.id);

      expect(body).toEqual(
        {
          "status": "success",
          "statusCode": 201,
          "message": "Batch quantity has been successfully added to the item, see details in data",
          "data": {
              "itemName": item1,
              "itemStatus": "Existing item",
              "totalItemQuantity": 11,
              "batchStatus": "Existing batch",
              "itemBatch": convertTimeToStrAndSecondsToNumber(persistedItemBatchFromDB),
              "itemBatchStatus": "Newly created item batch"
          }
      }
      ) 
    });

    it(`success: example showing how to achieve the specified output spec in the handover note`, async () => {
      const batchExpiryTime = firstSuccessfulBatch;
      const reqBody =   {
        expiry: batchExpiryTime,
        quantity: 3,
        useConsistentJsendResp: false /* to make this the default behaviour,
          this prop can also be set to false from the class
          in src/domain/dto/jsend-base-config.request.dto.ts */
      };
      const { body } = await request(app.getHttpServer())
        .post(`/${item1}/add`)
        .send(reqBody)
        .expect(201)

      expect(body).toEqual({});
    });
  })

  describe('/:item/sell (POST) (e2e)', () => {
    it('failure: item does not exist in inventory', async () => {
      const reqBody = {
        quantity: 7
      };
      const { body } = await request(app.getHttpServer())
        .post(`/beans/sell`)
        .send(reqBody)
        .expect(404)
      
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 404,
          "message": "Bad request: The item does not exist in the platforrm's inventory",
          "data": null
        }
      ) 
    });

    it(`failure: when request body is missing required field`, async () => {
      const reqBody =   {};
      const { body } = await request(app.getHttpServer())
        .post(`/${item1}/sell`)
        .send(reqBody)
        .expect(400)
      
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 400,
          "message": "Bad request, details are in data",
          "data": [
              {
                  "propertyName": "quantity",
                  "errors": {
                      "min": "quantity must not be less than 1",
                      "isInt": "quantity must be an integer number",
                      "isNumber": "quantity must be a number conforming to the specified constraints",
                      "isNotEmpty": "quantity should not be empty"
                  }
              }
          ]
        }
      ) 
    });

    it(`failure: quantity's value is not an integer`, async () => {
      const reqBody =   {
        quantity: 5.2
      };
      const { body } = await request(app.getHttpServer())
        .post(`/${item1}/sell`)
        .send(reqBody)
        .expect(400)
      
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 400,
          "message": "Bad request, details are in data",
          "data": [
              {
                  "propertyName": "quantity",
                  "errors": {
                      "isInt": "quantity must be an integer number"
                  }
              }
          ]
        }
      ) 
    });

    it(`failure: quantity's value is less than one`, async () => {
      const reqBody =   {
        quantity: 0
      };
      const { body } = await request(app.getHttpServer())
        .post(`/${item1}/sell`)
        .send(reqBody)
        .expect(400)
      
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 400,
          "message": "Bad request, details are in data",
          "data": [
              {
                  "propertyName": "quantity",
                  "errors": {
                      "min": "quantity must not be less than 1"
                  }
              }
          ]
        }
      ) 
    });
    
    it(`failure: insufficient item quantity in inventory to service sale quantity`, async () => {
      const reqBody =   {
        quantity: 24
      };
      const { body } = await request(app.getHttpServer())
        .post(`/${item1}/sell`)
        .send(reqBody)
        // .expect(400)
      console.log(body);
      const { data } = body;
      console.log(data);
      expect(data).toHaveProperty("itemName");
      expect(data).toHaveProperty("time");
      expect(data).toHaveProperty("maxQuantityInInventory");

      delete data.time;
      delete data.maxQuantityInInventory;

      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 400,
          "message": "Insufficient inventory for this sale, see item max inventory in data",
          "data": {
              "itemName": item1
          }
        }
      ) 
    });

    // beforeAll(async () => {
    //   const moduleFixture: TestingModule = await Test.createTestingModule({
    //     imports: [AppModule],
    //   }).compile();
  
    //   app = moduleFixture.createNestApplication();
    //   app.useGlobalPipes(new ValidationPipe());
  
    //   await app.init();
    //   connection = getConnection();
    // });
  
    // // afterEach(async () => {
    // //   await connection.close();
    // //   await app.close();
    // // });
    it(`success: sales is fulfilled from multiple item batches in ascending expiry sequence`, async () => {
      const reqBody =   {
        quantity: 5
      };

      // await connection.close();
      // await app.close();

      //       const moduleFixture: TestingModule = await Test.createTestingModule({
      //   imports: [AppModule],
      // }).compile();
  
      // app = moduleFixture.createNestApplication();
      // app.useGlobalPipes(new ValidationPipe());
  
      // await app.init();
      const { body } = await request(app.getHttpServer())
        .post(`/${item1}/sell`)
        .send(reqBody)
        .expect(201)
      
      // connection = getConnection();
      
      const persistedItemFromDB = await connection.getCustomRepository(ItemRepository).findByName(item1);
      const persistedSalesFromDB = await connection.getCustomRepository(SalesRepository).findOne({
        where: {
          item: persistedItemFromDB.id,
          quantity: 5
        }
      });

      const persistedSalesBatchesFromDB = (await connection.getCustomRepository(SalesBatchRepository)
        .findBySalesID(persistedSalesFromDB.id))
        .map((salesBatch: SalesBatch) => {
          delete salesBatch.sales;
          return convertTimeToStrAndSecondsToNumber(salesBatch);
        })
      
      expect(body).toEqual(
        {
          "status": "success",
          "statusCode": 201,
          "message": "Sales is successful for the item's quantities specified, see details in data",
          "data": {
              "sales": convertTimeToStrAndSecondsToNumber(persistedSalesFromDB),
              "salesBatches": persistedSalesBatchesFromDB
          }
        }
      ) 
    });

    it(`success: sales is fulfilled from one item batch`, async () => {
      const reqBody = {
        quantity: 1
      };
  
      // await app.init();
      const { body } = await request(app.getHttpServer())
        .post(`/${item1}/sell`)
        .send(reqBody)
        .expect(201)
      
      const persistedItemFromDB = await connection.getCustomRepository(ItemRepository).findByName(item1);
      const persistedSalesFromDB = await connection.getCustomRepository(SalesRepository).findOne({
        where: {
          item: persistedItemFromDB.id,
          quantity: 1
        }
      });

      const persistedSalesBatchesFromDB = await connection.getCustomRepository(SalesBatchRepository).findBySalesID(persistedSalesFromDB.id);
      const trimmedSalesBatches = persistedSalesBatchesFromDB
        .map((salesBatch: SalesBatch) => {
          delete salesBatch.sales;
          return convertTimeToStrAndSecondsToNumber(salesBatch);
        })
      
      expect(trimmedSalesBatches.length).toEqual(1);
      
      expect(body).toEqual(
        {
          "status": "success",
          "statusCode": 201,
          "message": "Sales is successful for the item's quantities specified, see details in data",
          "data": {
              "sales": convertTimeToStrAndSecondsToNumber(persistedSalesFromDB),
              "salesBatches": trimmedSalesBatches
          }
        }
      ) 
    });
  })

  describe('/:item/quantity (GET) (e2e)', () => {
    it('failure: item does not exist in inventory', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/beans/quantity`)
        .expect(404)
      
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 404,
          "message": "Bad request: The item does not exist in the platforrm's inventory",
          "data": null
        }
      ) 
    });

    // jest.setTimeout(15000);
    it('success - item has no quantities', async () => {
      const item3 = 'grape';
      
      const reqBody = {
        expiry: time1,
        quantity: 3
      };
      await request(app.getHttpServer())
        .post(`/${item3}/add`)
        .send(reqBody)
        .expect(201);
      
      const sellReqBody = {
        quantity: 3
      };
      await request(app.getHttpServer())
        .post(`/${item3}/sell`)
        .send(sellReqBody)
        .expect(201);
      
      const { body } = await request(app.getHttpServer())
        .get(`/${item3}/quantity`)
        .expect(200)
      
      expect(body.data).toHaveProperty("time");
      delete body.data.time;

      expect(body).toEqual(
        {
          "status": "success",
          "statusCode": 200,
          "message": "Retrieved item's unexpired quantities successfully, see details in data",
          "data": {
              "quantity": 0,
              "validTill": null,
            }
        }
      ) 
    });

    it('success - item has quantities', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/${item2}/quantity`)
        .expect(200)
      
      expect(body.data).toHaveProperty("time");
      delete body.data.time;
      
      expect(body).toEqual(
        {
          "status": "success",
          "statusCode": 200,
          "message": "Retrieved item's unexpired quantities successfully, see details in data",
          "data": {
              "quantity": 18,
              "validTill": time1,
          }
        }
      ) 
    });
  })

  jest.setTimeout(20000)
  describe('CRON-JOB OR /transferExpiredItemBatches (GET) (e2e)', () => {
    it(`success - logs a file having the date when called, the file will have details of items removal and disposal archival`, async () => {
      // Adding Items that will quickly expire around the next two seconds
      const batch1 = new Date().getTime() + 2000;
      const batch2 = new Date().getTime() + 2200;
      const item1 = "pawpaw";
      const item2 = "orange";

      const itemsArr = {
        [item1]: [
          {
            quantity: 6,
            expiry: batch1
          },
          {
            quantity: 4,
            expiry: batch1
          },
          {
            quantity: 3,
            expiry: batch2
          }
        ],
        [item2]: [
          {
            quantity: 4,
            expiry: batch1
          },
          {
            quantity: 9,
            expiry: batch2
          },
          {
            quantity: 3,
            expiry: batch2
          }
        ]
      }

      const getQuantities = itemArr => {
        return itemArr.reduce((total, item) => {
          total += item.quantity;
          return total;
        }, 0)
      };
      
      const itemQuantitesAdded = {
        [item1]: getQuantities(itemsArr[item1]),
        [item2]: getQuantities(itemsArr[item2])
      };

      const newlyCreatedItemBatches: ItemBatch[] = [];
      for (let [item, itemDetails] of Object.entries(itemsArr)) {
        for (let itemDetail of itemDetails) {
          try {
            const { body } = await request(app.getHttpServer())
              .post(`/${item}/add`)
              .send(itemDetail)
              .expect(201);

            const { itemBatch } = body.data;
            newlyCreatedItemBatches.push(itemBatch);
          } catch (err) {
            console.log(err);
          }

        }
      }
    
      for (let itemBatchBeforeExpiryRemoval of newlyCreatedItemBatches) {
        const itemBatchInDb = await connection.getCustomRepository(ItemBatchRepository).findByItemAndBatchID(itemBatchBeforeExpiryRemoval.item.id, itemBatchBeforeExpiryRemoval.batch.id);
        expect(Object.keys(itemBatchInDb)).toContain("item");
        expect(Object.keys(itemBatchInDb)).toContain("batch");
      }

      // Makes clearing and archiving to be delayed for 6 seconds, by which time the newly added items would have expired
      // Setting Cron decorator function argument to five seconds will trigger the clearing, or by unchecking the block of code
        // after the next two lines
      await new Promise((r) => setTimeout(r, 8000));
      /*Block of code for direct trigger of the expiry items clearing and archival functionality */
      // const { body } = await request(app.getHttpServer())
      //   .get(`/transferExpiredItemBatches`)
      //   .expect(200)
      
      // delete body.data;
      // expect(body).toEqual(
      //   {
      //       "status": "success",
      //       "statusCode": 200,
      //       "message": "See data for details",
      //     }
      //   );
        /* End of block of code for direct trigger of the expiry items clearing and archival functionality */
        
        // Checking correctness of loggedFiles as Quick Summary statistics of archival actions
        let loggedEventObj = await (async function getClearanceRecord() {
          try {
            const globPromise = util.promisify(glob);
            const logpath: string = join(__dirname, `../src/add-item-sell-item/${process.env['EXPIRED_ITEMS_LOG_DIR']}`, `*.json`);
            const fileNames: string[] = await globPromise(logpath);
            let fileHavingClearance = null;
            const complete = fileNames.some((name) => {
              let report = require(name);
              if (report.disposalArchiveDetails === null) {
                return false
              }
              fileHavingClearance = report;
              return true
            });
            if (complete === false)  {
              getClearanceRecord();
            } else {
              return fileHavingClearance;
            }
          } catch(err) {
          console.log(err);
        }
      })();
      const { disposalArchiveDetails } = loggedEventObj;
      
      // Archival Of the total of each expired quantity in Disposal records and their batches breakdown
      const { disposalRecord, expiredDisposalRecords } = disposalArchiveDetails;

      // Removal Test
      let presenceInItemBatchesTableAfterExpiryRemoval = [];
      for (let removedItemBatch of newlyCreatedItemBatches) {
        const presence = await connection.getCustomRepository(ItemBatchRepository).findByItemAndBatchID(removedItemBatch.item.id, removedItemBatch.batch.id);
        presenceInItemBatchesTableAfterExpiryRemoval.push(presence);
      }
      expect(presenceInItemBatchesTableAfterExpiryRemoval).toEqual([undefined, undefined, undefined, undefined, undefined, undefined]);

      const expiredItemDisposalQuantities = {};
      
      const persistedExpiredDisposalRecords = [];
      for ( let expiredDisposalRecord of expiredDisposalRecords) {
        expiredItemDisposalQuantities[expiredDisposalRecord.item.name] = expiredDisposalRecord.quantity;

        persistedExpiredDisposalRecords.push(await connection.getCustomRepository(ExpiredDisposalRepository).findOne(expiredDisposalRecord.id));
        
        // Archival of expired items happens on an item basis, such that each expired item will have its total expired quanties
        // on the ExpiredDisposal table and the details of the batches that make up that total will be on the expireddisposal batch table
        // We thus want to test that these quanties are indeed equivalent and equally both persisted
        const expiredDisposalBatches: ExpiredDisposalBatch[] = await connection.getCustomRepository(ExpiredDisposalBatchRepository).findByExpiredDisposalID(expiredDisposalRecord.id);
        const totalExpiredItemQuantitiesFromBatchesBreakdown = expiredDisposalBatches.reduce((total, expiredDisposalBatch) => {
          total += expiredDisposalBatch.quantity;
          return total;
        }, 0);
        expect(expiredDisposalRecord.quantity).toEqual(totalExpiredItemQuantitiesFromBatchesBreakdown);
      }

      expect(expiredItemDisposalQuantities).toEqual(itemQuantitesAdded);
      


      expect(disposalArchiveDetails.expiredDisposalRecords)
        .toEqual(persistedExpiredDisposalRecords.map(expiredDisposal => convertTimeToStrAndSecondsToNumber(expiredDisposal)));
    });

  })  
});