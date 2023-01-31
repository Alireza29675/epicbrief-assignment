import deals from '@/models/deals';
import createIntegrations from '../utils/createIntegration';

const dealsIntegration = createIntegrations({
  model: deals,
  service: {
    name: 'hubspot/deals',
    fetch: () => {
      console.log('fetching from hubspot');
      return Promise.resolve([
        {
          id: '1',
          _updatedAt: 123,
        },
      ]);
    },
    push: () => {
      console.log('pushing to hubspot');
      return Promise.resolve([]);
    },
  },
});

dealsIntegration.sync();
