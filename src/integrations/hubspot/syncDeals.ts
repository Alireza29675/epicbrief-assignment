import deals from '@/models/deals';
import hubspot from '@/services/hubspot';
import createIntegrations from '../utils/createIntegration';

const api = hubspot.crm.deals.basicApi;

const dealsIntegration = createIntegrations({
  model: deals,
  service: {
    name: 'hubspot/deals',

    // Fetch all deals from hubspot
    fetch: async () => {
      const deals = (await api.getPage()).results;

      // Transform the data to match the model
      return deals.map(({ id, properties, updatedAt }) => ({
        id,
        _updatedAt: updatedAt.getTime(),
        name: properties.dealname,
        amount: parseInt(properties.amount),
        stage: properties.dealstage,
      }));
    },

    // Defining the method to create a deal if needed
    create: async (deal) => {
      const createdDeal = await api.create({
        properties: {
          dealname: deal.name,
          amount: `${deal.amount}`,
          dealstage: deal.stage,
        },
      });

      return createdDeal.id;
    },

    // Defining the method to delete a deal if needed
    delete: async (id) => {
      await api.archive(id);
    },

    // Defining the method to update a deal if needed
    update: async (id, deal) => {
      await api.update(id, {
        properties: {
          dealname: deal.name,
          amount: `${deal.amount}`,
          dealstage: deal.stage,
        },
      });
    },
  },
});

dealsIntegration.sync();
