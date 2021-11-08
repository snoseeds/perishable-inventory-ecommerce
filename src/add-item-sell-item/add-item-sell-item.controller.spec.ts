import { Test, TestingModule } from '@nestjs/testing';
import { AddItemSellItemController } from './add-item-sell-item.controller';

describe('AddItemSellItemController', () => {
  let controller: AddItemSellItemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddItemSellItemController],
    }).compile();

    controller = module.get<AddItemSellItemController>(AddItemSellItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
