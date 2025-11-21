import { Test, TestingModule } from '@nestjs/testing';
import { MastraController } from './mastra.controller';
import { MastraService } from './mastra.service';

describe('MastraController', () => {
  let controller: MastraController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MastraController],
      providers: [MastraService],
    }).compile();

    controller = module.get<MastraController>(MastraController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
