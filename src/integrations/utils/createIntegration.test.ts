import { IService, Integration } from './createIntegration';
import integrations from '@/models/integrations';
import { Collection } from '@/models/utils/getCollection';

jest.mock('@/models/integrations', () => ({
  ready: Promise.resolve(),
  data: [] as {
    id: string;
    idInFirebase: string;
    idInService: string;
    service: string;
    _updatedAt: number;
  }[],
  create: jest.fn().mockResolvedValue('integration-id'),
  delete: jest.fn(),
  update: jest.fn(),
}));

const mockService: IService<{ data: string }> = {
  name: 'service-name',
  fetch: jest
    .fn()
    .mockResolvedValue([
      { id: 'service-item-1', data: 'service data 1', _updatedAt: 0 },
    ]),
  create: jest.fn().mockResolvedValue('service-item-id'),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockModel = {
  collectionName: 'model-name',
  ready: Promise.resolve(),
  data: [{ id: 'firebase-item-1', data: 'firebase data 1', _updatedAt: 0 }],
  create: jest.fn().mockResolvedValue('firebase-item-id'),
  delete: jest.fn(),
  update: jest.fn(),
};

describe('Integration', () => {
  let integration: Integration<{ data: string }>;

  beforeEach(() => {
    mockModel.data = [];
    mockService.fetch = jest.fn().mockResolvedValue([]);
    integrations.data = [];

    integration = new Integration(
      mockModel as unknown as Collection<{ data: string }>,
      mockService
    );
    jest.clearAllMocks();
  });

  describe('sync', () => {
    it('creates new firebase item if service item does not have an existing integration', async () => {
      mockService.fetch = jest.fn().mockResolvedValue([
        { id: 'service-item-1', data: 'service data 1', _updatedAt: 0 },
        { id: 'service-item-2', data: 'service data 2', _updatedAt: 0 },
        { id: 'service-item-3', data: 'service data 3', _updatedAt: 0 },
      ]);

      mockModel.data = [
        { id: 'firebase-item-1', data: 'firebase data 1', _updatedAt: 0 },
        { id: 'firebase-item-2', data: 'firebase data 2', _updatedAt: 0 },
      ];

      integrations.data = [
        {
          id: 'integration-1',
          idInFirebase: 'firebase-item-1',
          idInService: 'service-item-1',
          service: 'service-name',
          _updatedAt: 0,
          _createdAt: 0,
        },
        {
          id: 'integration-2',
          idInFirebase: 'firebase-item-2',
          idInService: 'service-item-2',
          service: 'service-name',
          _updatedAt: 0,
          _createdAt: 0,
        },
      ];

      await integration.sync();

      expect(mockModel.create).toHaveBeenCalledWith({ data: 'service data 3' });
      expect(integrations.create).toHaveBeenCalledWith({
        idInFirebase: 'firebase-item-id',
        idInService: 'service-item-3',
        service: 'service-name',
      });
    });

    it('updates firebase item if it is outdated compared to the corresponding service item', async () => {
      mockService.fetch = jest.fn().mockResolvedValue([
        { id: 'service-item-1', data: 'service data 1', _updatedAt: 100 }, // newest
      ]);

      mockModel.data = [
        { id: 'firebase-item-1', data: 'firebase data 1', _updatedAt: 10 }, // outdated
      ];

      integrations.data = [
        {
          id: 'integration-1',
          idInFirebase: 'firebase-item-1',
          idInService: 'service-item-1',
          service: 'service-name',
          _updatedAt: 1, // their last sync timestamp
          _createdAt: 0,
        },
      ];

      await integration.sync();

      expect(mockModel.update).toHaveBeenCalledWith('firebase-item-1', {
        data: 'service data 1',
      });
    });

    it('updates service item if it is outdated compared to the corresponding firebase item', async () => {
      mockService.fetch = jest.fn().mockResolvedValue([
        { id: 'service-item-1', data: 'service data 1', _updatedAt: 10 }, // outdated
      ]);

      mockModel.data = [
        { id: 'firebase-item-1', data: 'firebase data 1', _updatedAt: 100 }, // newest
      ];

      integrations.data = [
        {
          id: 'integration-1',
          idInFirebase: 'firebase-item-1',
          idInService: 'service-item-1',
          service: 'service-name',
          _updatedAt: 1, // their last sync timestamp
          _createdAt: 0,
        },
      ];

      await integration.sync();

      expect(mockService.update).toHaveBeenCalledWith('service-item-1', {
        data: 'firebase data 1',
      });
    });

    it('deletes firebase item and existing integrations if the corresponding service item does not exist anymore', async () => {
      mockService.fetch = jest
        .fn()
        .mockResolvedValue([
          { id: 'service-item-1', data: 'service data 1', _updatedAt: 0 },
        ]);

      mockModel.data = [
        { id: 'firebase-item-1', data: 'firebase data 1', _updatedAt: 0 },
        { id: 'firebase-item-2', data: 'firebase data 2', _updatedAt: 0 },
        { id: 'firebase-item-3', data: 'firebase data 3', _updatedAt: 0 },
      ];

      integrations.data = [
        {
          id: 'integration-1',
          idInFirebase: 'firebase-item-1',
          idInService: 'service-item-1',
          service: 'service-name',
          _updatedAt: 0,
          _createdAt: 0,
        },
        {
          id: 'integration-2',
          idInFirebase: 'firebase-item-2',
          idInService: 'service-item-2',
          service: 'service-name',
          _updatedAt: 0,
          _createdAt: 0,
        },
        {
          id: 'integration-3',
          idInFirebase: 'firebase-item-3',
          idInService: 'service-item-3',
          service: 'service-name',
          _updatedAt: 0,
          _createdAt: 0,
        },
      ];

      await integration.sync();

      expect(mockModel.delete).toHaveBeenCalledWith('firebase-item-2');
      expect(integrations.delete).toHaveBeenCalledWith('integration-2');

      expect(mockModel.delete).toHaveBeenCalledWith('firebase-item-3');
      expect(integrations.delete).toHaveBeenCalledWith('integration-3');
    });

    it('deletes service item and existing integrations if the corresponding firebase item does not exist anymore', async () => {
      mockService.fetch = jest.fn().mockResolvedValue([
        { id: 'service-item-1', data: 'service data 1', _updatedAt: 0 },
        { id: 'service-item-2', data: 'service data 2', _updatedAt: 0 },
        { id: 'service-item-3', data: 'service data 3', _updatedAt: 0 },
      ]);

      mockModel.data = [
        { id: 'firebase-item-1', data: 'firebase data 1', _updatedAt: 0 },
      ];

      integrations.data = [
        {
          id: 'integration-1',
          idInFirebase: 'firebase-item-1',
          idInService: 'service-item-1',
          service: 'service-name',
          _updatedAt: 0,
          _createdAt: 0,
        },
        {
          id: 'integration-2',
          idInFirebase: 'firebase-item-2',
          idInService: 'service-item-2',
          service: 'service-name',
          _updatedAt: 0,
          _createdAt: 0,
        },
        {
          id: 'integration-3',
          idInFirebase: 'firebase-item-3',
          idInService: 'service-item-3',
          service: 'service-name',
          _updatedAt: 0,
          _createdAt: 0,
        },
      ];

      await integration.sync();

      expect(mockService.delete).toHaveBeenCalledWith('service-item-2');
      expect(integrations.delete).toHaveBeenCalledWith('integration-2');

      expect(mockService.delete).toHaveBeenCalledWith('service-item-3');
      expect(integrations.delete).toHaveBeenCalledWith('integration-3');
    });

    it('creates a new service and integration if there is a new firebase item', async () => {
      mockService.create = jest.fn().mockResolvedValue('service-item-3');

      mockService.fetch = jest.fn().mockResolvedValue([
        { id: 'service-item-1', data: 'service data 1', _updatedAt: 0 },
        { id: 'service-item-2', data: 'service data 2', _updatedAt: 0 },
      ]);

      mockModel.data = [
        { id: 'firebase-item-1', data: 'firebase data 1', _updatedAt: 0 },
        { id: 'firebase-item-2', data: 'firebase data 2', _updatedAt: 0 },
        { id: 'firebase-item-3', data: 'firebase data 3', _updatedAt: 0 },
      ];

      integrations.data = [
        {
          id: 'integration-1',
          idInFirebase: 'firebase-item-1',
          idInService: 'service-item-1',
          service: 'service-name',
          _updatedAt: 0,
          _createdAt: 0,
        },
        {
          id: 'integration-2',
          idInFirebase: 'firebase-item-2',
          idInService: 'service-item-2',
          service: 'service-name',
          _updatedAt: 0,
          _createdAt: 0,
        },
      ];

      await integration.sync();

      expect(mockService.create).toHaveBeenCalledWith({
        data: 'firebase data 3',
        _updatedAt: 0,
      });

      expect(integrations.create).toHaveBeenCalledWith({
        idInFirebase: 'firebase-item-3',
        idInService: 'service-item-3',
        service: 'service-name',
      });
    });

    it('creates a new firebase item and integration if there is a new service item', async () => {
      mockModel.create = jest.fn().mockResolvedValue('firebase-item-3');

      mockService.fetch = jest.fn().mockResolvedValue([
        { id: 'service-item-1', data: 'service data 1', _updatedAt: 0 },
        { id: 'service-item-2', data: 'service data 2', _updatedAt: 0 },
        { id: 'service-item-3', data: 'service data 3', _updatedAt: 0 },
      ]);

      mockModel.data = [
        { id: 'firebase-item-1', data: 'firebase data 1', _updatedAt: 0 },
        { id: 'firebase-item-2', data: 'firebase data 2', _updatedAt: 0 },
      ];

      integrations.data = [
        {
          id: 'integration-1',
          idInFirebase: 'firebase-item-1',
          idInService: 'service-item-1',
          service: 'service-name',
          _updatedAt: 0,
          _createdAt: 0,
        },
        {
          id: 'integration-2',
          idInFirebase: 'firebase-item-2',
          idInService: 'service-item-2',
          service: 'service-name',
          _updatedAt: 0,
          _createdAt: 0,
        },
      ];

      await integration.sync();

      expect(mockModel.create).toHaveBeenCalledWith({
        data: 'service data 3',
      });

      expect(integrations.create).toHaveBeenCalledWith({
        idInFirebase: 'firebase-item-3',
        idInService: 'service-item-3',
        service: 'service-name',
      });
    });
  });
});
