import meetings from '@/models/meetings';
import hubspot from '@/services/hubspot';
import createIntegrations from '../utils/createIntegration';
import { convert as htmlToText } from 'html-to-text';

const api = hubspot.crm.objects.meetings.basicApi;

const meetingsIntegration = createIntegrations({
  model: meetings,
  service: {
    name: 'hubspot/meetings',
    fetch: async () => {
      // Fetch all meetings from Hubspot
      // What are those two undefineds? Well, the hubspot library's api is a bit weird:)
      // I could also use the api itself and call it using axios
      const { results: meetings } = await api.getPage(undefined, undefined, [
        'hs_internal_meeting_notes',
        'hs_meeting_body',
      ]);

      return meetings.map(({ id, properties, updatedAt }) => ({
        id,
        _updatedAt: updatedAt.getTime(),
        // We need to convert the html to text because the hubspot api send the data as html
        body: htmlToText(properties['hs_meeting_body']),
        summary: htmlToText(properties['hs_internal_meeting_notes']),
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
