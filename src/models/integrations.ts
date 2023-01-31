import getCollection, { Collection } from './utils/getCollection';

type TService = 'hubspot'; // | 'intercom' | 'zendesk';

interface IIntegration {
  path: string; // firebase path including the id
  service: TService;
  syncedAt: Date;
  idInService: string;
}

const integrations = getCollection<IIntegration>(
  'integrations'
) as Collection<IIntegration>;

// Get a synced entry by service and path
export async function getSyncedEntry(serviceName: TService, path: string) {
  await integrations.ready;
  return integrations.data.find(
    (entry) => entry.service === serviceName && entry.path === path
  );
}

// Update or create a new synced entry
export async function setSyncedEntry(
  serviceName: TService,
  path: string,
  idInService: string
) {
  await integrations.ready;
  const entry = await getSyncedEntry(serviceName, path);

  const newEntryData: IIntegration = {
    path,
    service: serviceName,
    syncedAt: new Date(), // update the syncedAt timestamp
    idInService,
  };

  if (entry) {
    integrations.update(entry.id, newEntryData);
  } else {
    integrations.create(newEntryData);
  }
}

export default integrations;
