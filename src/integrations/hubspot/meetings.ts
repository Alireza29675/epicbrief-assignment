import meetings from '@/models/meetings';
import hubspot from '@/services/hubspot';
import createIntegrations from '../utils/createIntegration';

const api = hubspot.crm.objects.meetings.basicApi;

const meetingsIntegration = createIntegrations({
  model: meetings,
  service: {
    name: 'hubspot/meetings',
    fetch: async () => {
      // Fetch all meetings from Hubspot
      // What are those two undefineds? Well, the hubspot library's api is a bit weird:)
      const { results: meetings } = await api.getPage(undefined, undefined, [
        'hs_internal_meeting_notes',
        'hs_meeting_body',
      ]);

      return meetings.map(({ id, properties, updatedAt }) => ({
        id,
        _updatedAt: updatedAt.getTime(),
        body: properties['hs_meeting_body'],
        summary: properties['hs_internal_meeting_notes'],
      }));
    },
    update: async (id, data) => {
      // Updates a existing meeting in Hubspot
      api.update(id, {
        properties: {
          hs_meeting_body: data.body,
          hs_internal_meeting_notes: data.summary,
        },
      });
    },
  },
});

export default meetingsIntegration;
