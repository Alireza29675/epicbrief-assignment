import { IRelatedTo } from './types';
import getCollection from './utils/getCollection';

interface IDeal {
  name: string;
  relatedTo: IRelatedTo;
}

const meetings = getCollection<IDeal>('meetings');

export default meetings;
