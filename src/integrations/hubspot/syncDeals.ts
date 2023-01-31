import deals from '@/models/deals';
import integrations from '@/models/integrations';

export default async function syncDeals() {
  await deals.ready;
  await integrations.ready;

  console.log('deals', deals.data);
}
