import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { GoalsRepository } from './goals.repository';
import { GoalsService } from './goals.service';

describe('GoalsService', () => {
  let service: GoalsService;
  let repository: jest.Mocked<GoalsRepository>;

  const mockGoalDocument = {
    _id: 'goal-123',
    userId: 'user-1',
    title: 'Emergency Fund',
    targetAmount: 5000,
    currentAmount: 1000,
    targetDate: new Date('2026-12-31'),
    notes: 'Safety buffer',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDomainGoal = {
    id: 'goal-123',
    userId: 'user-1',
    title: 'Emergency Fund',
    targetAmount: 5000,
    currentAmount: 1000,
    targetDate: '2026-12-31T00:00:00.000Z',
    notes: 'Safety buffer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const mockRepo = {
      findByUser: jest.fn().mockResolvedValue([mockGoalDocument]),
      create: jest.fn().mockResolvedValue(mockGoalDocument),
      update: jest.fn().mockResolvedValue(mockGoalDocument),
      delete: jest.fn().mockResolvedValue(mockGoalDocument),
      toDomain: jest.fn().mockReturnValue(mockDomainGoal),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        {
          provide: GoalsRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
    repository = module.get(GoalsRepository);
  });

  it('should list goals for a user', async () => {
    const result = await service.list('user-1');
    expect(repository.findByUser).toHaveBeenCalledWith('user-1');
    expect(repository.toDomain).toHaveBeenCalledWith(mockGoalDocument);
    expect(result).toEqual([mockDomainGoal]);
  });

  it('should create a new goal', async () => {
    const input = {
      title: 'Emergency Fund',
      targetAmount: 5000,
      currentAmount: 1000,
      targetDate: '2026-12-31T00:00:00.000Z',
      notes: 'Safety buffer',
    };

    const result = await service.create('user-1', input);
    expect(repository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      ...input,
    });
    expect(result).toEqual(mockDomainGoal);
  });

  it('should update an existing goal', async () => {
    const updateInput = {
      currentAmount: 1500,
    };

    const result = await service.update('user-1', 'goal-123', updateInput);
    expect(repository.update).toHaveBeenCalledWith('goal-123', 'user-1', updateInput);
    expect(result).toEqual(mockDomainGoal);
  });

  it('should delete a goal', async () => {
    const result = await service.delete('user-1', 'goal-123');
    expect(repository.delete).toHaveBeenCalledWith('goal-123', 'user-1');
    expect(result).toEqual(mockDomainGoal);
  });
});
