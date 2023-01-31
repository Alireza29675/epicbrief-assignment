import deals from '@/models/deals';
import hubspot from '@/services/hubspot';
import createIntegration from '../utils/createIntegration';

const api = hubspot.crm.deals.basicApi;

const dealsIntegration = createIntegration({
  model: deals,
  service: {
    name: 'hubspot/deals',

    // Fetch all deals from Hubspot
    fetch: async () => {
      const { results: deals } = await api.getPage();
      return deals.map(({ id, properties, updatedAt }) => ({
        id,
        _updatedAt: updatedAt.getTime(),
        name: properties.dealname,
        amount: parseInt(properties.amount),
        stage: properties.dealstage,
      }));
    },

    // Creates a deal in Hubspot
    create: async ({ name, amount, stage }) => {
      const { id: createdDealId } = await api.create({
        properties: {
          dealname: name,
          amount: `${amount}`,
          dealstage: stage,
        },
      });
      return createdDealId;
    },

    // Deletes a deal from Hubspot
    delete: async (id) => api.archive(id),

    // Updates a deal in Hubspot
    update: async (id, { name, amount, stage }) => {
      api.update(id, {
        properties: {
          dealname: name,
          amount: `${amount}`,
          dealstage: stage,
        },
      });
    },
  },
});

export default dealsIntegration;
