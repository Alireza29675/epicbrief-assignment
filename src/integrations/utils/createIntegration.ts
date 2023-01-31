import integrations from '@/models/integrations';

import { Collection } from '@/models/utils/getCollection';
import { DocumentData } from 'firebase/firestore';

type TStandardServiceData<T> = T & {
  id: string;
  _updatedAt: number;
};

// This is the definition of service that we will use to integrate with
interface IService<T extends DocumentData> {
  name: string;
  fetch: () => Promise<TStandardServiceData<T>[]>;
  create: (data: Omit<T, 'id'>) => Promise<string>;
  update: (id: string, data: Omit<T, 'id'>) => Promise<void>;
  delete: (id: string) => Promise<void>;
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
        // This item needs to be created in the service
        const idInService = await this.service.create(data);
        await integrations.create({
          idInFirebase: id,
          idInService,
          service: this.service.name,
        });
      } else {
        // This item needs to be compared and updated if needed
      }
    }

    for (const serviceItem of serviceItems) {
      const { id, _updatedAt, ...data } = serviceItem;
      const existingIntegration = existingIntegrations.find(
        (integration) => integration.idInService === id
      );

      if (!existingIntegration) {
        // This item needs to be pushed to firebase
        const idInFirebase = await this.model.create(data as unknown as T);

        await integrations.create({
          idInFirebase,
          idInService: id,
          service: this.service.name,
        });
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
