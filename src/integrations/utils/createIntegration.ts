import integrations from '@/models/integrations';

import { Collection } from '@/models/utils/getCollection';
import { DocumentData } from 'firebase/firestore';

type TStandardServiceData<T> = T & {
  id: string;
  _updatedAt: number;
};

// This is the definition of service that we will use to integrate with
export interface IService<T extends DocumentData> {
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
    const firebaseItems = this.model.data as TStandardServiceData<T>[];

    // Fetch from service
    const serviceItems = await this.service.fetch();

    // Waiting for integration to be ready
    await integrations.ready;
    const existingIntegrations = integrations.data.filter(
      (integration) => integration.service === this.service.name
    );

    const syncedItemsToCheck: {
      firebaseItem: TStandardServiceData<T>;
      serviceItem: TStandardServiceData<T>;
    }[] = [];

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
        continue;
      }

      // Try to find the paired item in serviceItems
      const serviceItem = serviceItems.find(
        (item) => item.id === existingIntegration.idInService
      );

      // If both items are found, add them to syncedItemsToCheck array
      // to be compared later
      if (serviceItem) {
        // Check if the item is already in syncedItemsToCheck array
        const isAlreadyInSyncedItemsToCheck = syncedItemsToCheck.some(
          (item) =>
            item.firebaseItem.id === firebaseItem.id &&
            item.serviceItem.id === existingIntegration.idInService
        );

        if (!isAlreadyInSyncedItemsToCheck) {
          syncedItemsToCheck.push({ firebaseItem, serviceItem });
        }
        continue;
      }

      // If the item has an integration but it's not in serviceItems,
      // it means that the item was deleted from the service and we need
      // to delete it from firebase
      await this.model.delete(id);
      await integrations.delete(existingIntegration.id);
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

        continue;
      }

      // Try to find the paired item in firebaseItems
      const firebaseItem = firebaseItems.find(
        (item) => item.id === existingIntegration.idInFirebase
      );

      // If both items are found, add them to syncedItemsToCheck array
      // to be compared later
      if (firebaseItem) {
        // Check if the item is already in syncedItemsToCheck array
        const isAlreadyInSyncedItemsToCheck = syncedItemsToCheck.some(
          (item) =>
            item.firebaseItem.id === existingIntegration.idInFirebase &&
            item.serviceItem.id === serviceItem.id
        );

        if (!isAlreadyInSyncedItemsToCheck) {
          syncedItemsToCheck.push({ firebaseItem, serviceItem });
        }
        continue;
      }

      // If the item has an integration but it's not in firebaseItems,
      // it means that the item was deleted from firebase and we need
      // to delete it from the service
      await this.service.delete(id);
      await integrations.delete(existingIntegration.id);
    }

    // Compare the syncedItemsToCheck array and update the items to the newer version
    for (const { firebaseItem, serviceItem } of syncedItemsToCheck) {
      const integrationItem = existingIntegrations.find(
        (integration) =>
          integration.idInFirebase === firebaseItem.id &&
          integration.idInService === serviceItem.id
      )!;

      if (
        integrationItem._updatedAt > firebaseItem._updatedAt &&
        integrationItem._updatedAt > serviceItem._updatedAt
      ) {
        // Check if the integration item is newer than both firebase and service items.
        // If it is then we don't need to update anything
        continue;
      }

      // If one or two of the items are newer than the integration item,
      // we need to update the items to the newer version
      // and update integration.updatedAt to the current time:
      if (firebaseItem._updatedAt > serviceItem._updatedAt) {
        // Update the service item
        await this.service.update(serviceItem.id, firebaseItem);
      } else {
        // Update the firebase item
        await this.model.update(firebaseItem.id, serviceItem);
      }

      await integrations.update(integrationItem.id, {});
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
