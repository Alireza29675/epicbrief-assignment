import getCollection from './utils/getCollection';

interface IDeal {
  name: string;
  amount: number;
}

const deals = getCollection<IDeal>('deals');

export default deals;
