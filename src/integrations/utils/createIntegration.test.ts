import { IService, Integration } from './createIntegration';
import integrations from '@/models/integrations';
import { Collection } from '@/models/utils/getCollection';

jest.mock('@/models/integrations', () => ({
  ready: Promise.resolve(),
  data: [
    {
      id: 'integration-1',
      idInFirebase: 'firebase-item-1',
      service: 'service-item-1',
    },
    {
      id: 'integration-2',
      idInFirebase: 'firebase-item-2',
      service: 'service-item-2',
    },
    {
      id: 'integration-3',
      idInFirebase: 'firebase-item-3',
      service: 'a-service-that-does-not-exist-anymore',
    },
    {
      id: 'integration-4',
      idInFirebase: 'a-firebase-item-that-does-not-exist-anymore',
      service: 'service-item-4',
    },
  ],
  create: jest.fn().mockResolvedValue('integration-id'),
  delete: jest.fn(),
}));

const mockService: IService<{ data: string }> = {
  name: 'service-name',
  fetch: jest.fn().mockResolvedValue([
    { id: 'service-item-1', data: 'item 1', _updatedAt: 1 },
    { id: 'service-item-2', data: 'item 2', _updatedAt: 2 },
    { id: 'service-item-3', data: 'item 3', _updatedAt: 3 },
    { id: 'service-item-4', data: 'item 4', _updatedAt: 4 },
  ]),
  create: jest.fn().mockResolvedValue('service-item-id'),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockModel = {
  collectionName: 'model-name',
  ready: Promise.resolve(),
  data: [
    { id: 'firebase-item-1', data: 'item 1', _updatedAt: 4 },
    { id: 'firebase-item-2', data: 'item 2', _updatedAt: 5 },
  ],
  create: jest.fn().mockResolvedValue('firebase-item-id'),
  delete: jest.fn(),
} as unknown as Collection<{ data: string }>;

describe('Integration', () => {
  let integration: Integration<{ data: string }>;

  beforeEach(() => {
    integration = new Integration(mockModel, mockService);
    jest.clearAllMocks();
  });

  describe('sync', () => {
    it('creates new firebase item if service item does not have an existing integration', async () => {
      await integration.sync();

      expect(mockModel.create).toHaveBeenCalledWith({ data: 'item 3' });
      expect(integrations.create).toHaveBeenCalledWith({
        idInFirebase: 'firebase-item-id',
        idInService: 'service-item-3',
        service: 'service-name',
      });
    });

    it('deletes firebase item if paired service item does not exist', async () => {
      await integration.sync();

      // firebase-item-3 is paired with a service item that does not exist anymore

      expect(mockModel.delete).toHaveBeenCalledWith('firebase-item-3');
      expect(integrations.delete).toHaveBeenCalledWith('integration-3');
    });

    it('deletes service item if paired firebase item does not exist', async () => {
      await integration.sync();

      // service-item-4 is paired with a firebase item that does not exist anymore

      expect(mockService.delete).toHaveBeenCalledWith('service-item-4');
      expect(integrations.delete).toHaveBeenCalledWith('integration-4');
    });
  });
});
