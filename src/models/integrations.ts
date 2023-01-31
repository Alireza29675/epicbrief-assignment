import getCollection, { Collection } from './utils/getCollection';

type TService = 'hubspot'; // | 'intercom' | 'zendesk';

interface IIntegration {
  service: TService;
  pathInFirebase: string;
  idInService: string;
}

const integrations = getCollection<IIntegration>(
  'integrations'
) as Collection<IIntegration>;

// Get a synced entry by service and path
export async function getSyncedEntry(serviceName: TService, path: string) {
  // when the integrations collection is ready
  await integrations.ready;

  // Find the sync entry
  return integrations.data.find(
    (entry) => entry.service === serviceName && entry.pathInFirebase === path
  );
}

// Update or create a new synced entry
export async function setSyncedEntry(
  serviceName: TService,
  pathInFirebase: string,
  idInService: string
) {
  // when the integrations collection is ready
  await integrations.ready;

  // Find the sync entry
  const entry = await getSyncedEntry(serviceName, pathInFirebase);

  // Prepare the new entry data
  const newEntryData: IIntegration = {
    pathInFirebase,
    service: serviceName,
    idInService,
  };

  // and update or create the entry
  if (entry) {
    integrations.update(entry.id, newEntryData);
  } else {
    integrations.create(newEntryData);
  }
}

export default integrations;
