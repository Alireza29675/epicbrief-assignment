import integrations from '@/models/integrations';

import { Collection } from '@/models/utils/getCollection';
import { DocumentData } from 'firebase/firestore';

type TFetchFromService = () => Promise<
  Array<
    unknown & {
      id: string;
      _updatedAt: number;
    }
  >
>;

type TPushToService = () => Promise<any>;

class Integration<T extends DocumentData> {
  service: string;
  model: Collection<T>;
  fetchFromService: TFetchFromService;
  pushToService: TPushToService;

  constructor(
    service: string,
    model: Collection<T>,
    fetchFromService: TFetchFromService,
    pushToService: TPushToService
  ) {
    this.service = service;
    this.model = model;
    this.fetchFromService = fetchFromService;
    this.pushToService = pushToService;
  }

  async sync() {
    // Wait for the model to be ready and get the data
    await this.model.ready;
    const firebaseItems = this.model.data;

    // Fetch from service
    const serviceItems = await this.fetchFromService();

    // Waiting for integration to be ready
    await integrations.ready;
    const existingIntegrations = integrations.data.filter(
      (integration) => integration.service === this.service
    );

    for (const firebaseItem of firebaseItems) {
      const { id, ...data } = firebaseItem;
      const existingIntegration = existingIntegrations.find(
        (integration) => integration.idInFirebase === id
      );

      if (!existingIntegration) {
        // This item needs to be pushed to the service
        console.log('pushing to service ->', data);
      } else {
        // This item needs to be compared and updated if needed
      }
    }

    for (const serviceItem of serviceItems) {
      const { id, ...data } = serviceItem;
      const existingIntegration = existingIntegrations.find(
        (integration) => integration.idInService === id
      );

      if (!existingIntegration) {
        // This item needs to be pushed to firebase
        console.log('pushing to firebase ->', data);
      } else {
        // This item needs to be compared and updated if needed
      }
    }
  }
}

export default function createIntegrations<T extends DocumentData>({
  model,
  service: { name, fetch: fetchFromService, push: pushToService },
}: {
  model: Collection<T>;
  service: {
    name: string;
    fetch: TFetchFromService;
    push: TPushToService;
  };
}) {
  return new Integration(name, model, fetchFromService, pushToService);
}
