import { Test, TestingModule } from '@nestjs/testing';
import { AddItemSellItemService } from './add-item-sell-item.service';

describe('AddItemSellItemService', () => {
  let service: AddItemSellItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddItemSellItemService],
    }).compile();

    service = module.get<AddItemSellItemService>(AddItemSellItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
