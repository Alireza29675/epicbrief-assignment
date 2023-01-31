import getCollection, { Collection } from './utils/getCollection';

export interface IDeal {
  amount: number;
  name: string;
  stage: string;
}

const deals = getCollection<IDeal>('deals') as Collection<IDeal>;

export default deals;
