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
    // Wait for the model to be ready and fetch its data
    await this.model.ready;
    const firebaseItems = this.model.data as TStandardServiceData<T>[];

    // Fetch items from the service
    const serviceItems = await this.service.fetch();

    // Wait for the integrations to be ready and filter existing ones
    await integrations.ready;
    const existingIntegrations = integrations.data.filter(
      (integration) => integration.service === this.service.name
    );

    // Store firebase and service items that need to be compared and synced
    const syncedItemsToCheck: {
      firebaseItem: TStandardServiceData<T>;
      serviceItem: TStandardServiceData<T>;
    }[] = [];

    // Check each firebase item
    for (const firebaseItem of firebaseItems) {
      const { id, ...data } = firebaseItem;
      const existingIntegration = existingIntegrations.find(
        (integration) => integration.idInFirebase === id
      );

      // If the firebase item doesn't have an integration, create it in the service
      if (!existingIntegration) {
        const idInService = await this.service.create(data);
        await integrations.create({
          idInFirebase: id,
          idInService,
          service: this.service.name,
        });
        continue;
      }

      // Check if the paired service item exists
      const serviceItem = serviceItems.find(
        (item) => item.id === existingIntegration.idInService
      );

      // If both firebase and service items exist, add them to syncedItemsToCheck
      if (serviceItem) {
        if (
          !syncedItemsToCheck.some(
            (item) =>
              item.firebaseItem.id === firebaseItem.id &&
              item.serviceItem.id === serviceItem.id
          )
        ) {
          syncedItemsToCheck.push({ firebaseItem, serviceItem });
        }
        continue;
      }

      // If the service item doesn't exist, delete the integration and firebase item
      await this.model.delete(id);
      await integrations.delete(existingIntegration.id);
    }

    // Loop through each service item
    for (const serviceItem of serviceItems) {
      // Destructure the id, _updatedAt, and data from the service item
      const { id, _updatedAt, ...data } = serviceItem;

      // Check if the service item has an existing integration with the service
      const existingIntegration = existingIntegrations.find(
        (integration) => integration.idInService === id
      );

      // If there is no existing integration, create one in firebase
      if (!existingIntegration) {
        // Create the item in firebase
        const idInFirebase = await this.model.create(data as unknown as T);

        // Create the integration record
        await integrations.create({
          idInFirebase,
          idInService: id,
          service: this.service.name,
        });
      } else {
        // If the item has an existing integration, find the paired item in firebase
        const firebaseItem = firebaseItems.find(
          (item) => item.id === existingIntegration.idInFirebase
        );

        // If the paired firebase item exists, add it to the synced items to check array
        if (firebaseItem) {
          // Check if the item is already in syncedItemsToCheck
          const isAlreadyInSyncedItemsToCheck = syncedItemsToCheck.some(
            (item) =>
              item.firebaseItem.id === existingIntegration.idInFirebase &&
              item.serviceItem.id === serviceItem.id
          );

          // If it's not already in the array, add it
          if (!isAlreadyInSyncedItemsToCheck) {
            syncedItemsToCheck.push({ firebaseItem, serviceItem });
          }
        } else {
          // If the item has an integration but the paired item in firebase was deleted,
          // delete the item from the service and the integration record
          await this.service.delete(id);
          await integrations.delete(existingIntegration.id);
        }
      }
    }

    // Compare the `syncedItemsToCheck` array and update the items to the newer version.
    for (const { firebaseItem, serviceItem } of syncedItemsToCheck) {
      const integrationItem = existingIntegrations.find(
        (integration) =>
          integration.idInFirebase === firebaseItem.id &&
          integration.idInService === serviceItem.id
      );

      // If integrationItem is not found, skip to the next iteration
      if (!integrationItem) {
        continue;
      }

      // Check if the integration item is newer than both firebase and service items
      if (
        integrationItem._updatedAt > firebaseItem._updatedAt &&
        integrationItem._updatedAt > serviceItem._updatedAt
      ) {
        continue;
      }

      if (firebaseItem._updatedAt > serviceItem._updatedAt) {
        // Update the service item
        await this.service.update(serviceItem.id, firebaseItem);
      } else {
        // Update the firebase item
        await this.model.update(firebaseItem.id, serviceItem);
      }

      // Update integration with the updatedAt field set to the current time
      await integrations.update(integrationItem.id, {});
    }
  }
}

// Function that creates integrations using a provided model and service
export default function createIntegrations<T extends DocumentData>(options: {
  model: Collection<T>;
  service: IService<T>;
}): Integration<T> {
  // Destructure the options object to get the model and service
  const { model, service } = options;
  // Return a new instance of Integration with the provided model and service
  return new Integration<T>(model, service);
}
