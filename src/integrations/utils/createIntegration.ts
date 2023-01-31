import integrations from '@/models/integrations';

import { Collection } from '@/models/utils/getCollection';
import { DocumentData } from 'firebase/firestore';

interface IStandardServiceData {
  [key: string]: unknown;
  id: string;
  _updatedAt: number;
}

// This is the definition of service that we will use to integrate with
interface IService<T extends DocumentData> {
  name: string;
  fetch: () => Promise<IStandardServiceData[]>;
  push: (data: Omit<T, 'id'>) => Promise<void>;
}

class Integration<T extends DocumentData> {
  model: Collection<T>;
  service: IService<T>;

  constructor(model: Collection<T>, service: IService<T>) {
    this.model = model;
    this.service = service;
  }

  async sync() {
    // Wait for the model to be ready and get the data
    await this.model.ready;
    const firebaseItems = this.model.data;

    // Fetch from service
    const serviceItems = await this.service.fetch();

    // Waiting for integration to be ready
    await integrations.ready;
    const existingIntegrations = integrations.data.filter(
      (integration) => integration.service === this.service.name
    );

    for (const firebaseItem of firebaseItems) {
      const { id, ...data } = firebaseItem;
      const existingIntegration = existingIntegrations.find(
        (integration) => integration.idInFirebase === id
      );

      if (!existingIntegration) {
        // This item needs to be pushed to the service
        this.service.push(data);
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
  service,
}: {
  model: Collection<T>;
  service: IService<T>;
}) {
  return new Integration(model, service);
}
