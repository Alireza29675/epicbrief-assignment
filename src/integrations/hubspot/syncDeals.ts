import deals from '@/models/deals';
import createIntegrations from '../utils/createIntegration';

const dealsIntegration = createIntegrations({
  model: deals,
  service: {
    name: 'hubspot/deals',
    fetch: async () => {
      return [
        {
          name: 'a',
          id: '1',
          _updatedAt: 123,
        },
      ];
    },
    push: async (deal) => {
      console.log('pushing to hubspot', deal);
    },
  },
});

dealsIntegration.sync();
