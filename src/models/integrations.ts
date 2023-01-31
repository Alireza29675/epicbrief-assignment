import getCollection, { Collection } from './utils/getCollection';

type TService = 'hubspot'; // | 'intercom' | 'zendesk';

interface IIntegration {
  path: string; // firebase path including the id
  service: TService;
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
    (entry) => entry.service === serviceName && entry.path === path
  );
}

// Update or create a new synced entry
export async function setSyncedEntry(
  serviceName: TService,
  path: string,
  idInService: string
) {
  // when the integrations collection is ready
  await integrations.ready;

  // Find the sync entry
  const entry = await getSyncedEntry(serviceName, path);

  // Prepare the new entry data
  const newEntryData: IIntegration = {
    path,
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

export async function needsFetchFromService(
  serviceName: TService,
  idInService: string,
  lastUpdateTimestampInService: number
) {
  // when the integrations collection is ready
  await integrations.ready;

  // Find the sync entry
  const entry = integrations.data.find(
    (entry) =>
      entry.service === serviceName && entry.idInService === idInService
  );

  // If we don't have a sync entry, we need to fetch it
  if (!entry) {
    return true;
  }

  // `entry._updatedAt` is the last time we synced the data from the service or to the service
  // If the entry is older than the last update timestamp in the service, we need to fetch it again
  return entry._updatedAt < lastUpdateTimestampInService;
}

export async function needsPushToService(
  serviceName: TService,
  path: string,
  lastUpdateTimestampInFirebase: number
) {
  // when the integrations collection is ready
  await integrations.ready;

  // Find the sync entry
  const entry = integrations.data.find(
    (entry) => entry.service === serviceName && entry.path === path
  );

  // If we don't have a sync entry, we need to push it
  if (!entry) {
    return true;
  }

  // `entry._updatedAt` is the last time we synced the data from the service or to the service
  // If the entry is older than the last update timestamp in firebase, we need to push it again
  return entry._updatedAt < lastUpdateTimestampInFirebase;
}

export default integrations;
