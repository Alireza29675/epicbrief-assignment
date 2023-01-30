import { IRelatedTo } from './types';
import getCollection from './utils/getCollection';

interface IDeal {
  name: string;
  amount: number;
  relatedTo: IRelatedTo;
}

const deals = getCollection<IDeal>('deals');

export default deals;
