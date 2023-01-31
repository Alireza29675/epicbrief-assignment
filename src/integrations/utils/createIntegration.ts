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
    const firebaseItems = this.model.data.map(({ id, _updatedAt }) => ({
      id,
      _updatedAt,
    }));

    // Fetch from service
    const serviceItems = (await this.fetchFromService()).map(
      ({ id, _updatedAt }) => ({
        id,
        _updatedAt,
      })
    );

    console.log('firebaseItems', firebaseItems);
    console.log('serviceItems', serviceItems);
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
