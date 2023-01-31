import getCollection, { Collection } from './utils/getCollection';

interface IDeal {
  name: string;
  amount: number;
}

const deals = getCollection<IDeal>('deals') as Collection<IDeal>;

export default deals;
