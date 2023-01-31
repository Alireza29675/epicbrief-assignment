import getCollection from './utils/getCollection';

interface IDeal {
  name: string;
}

const meetings = getCollection<IDeal>('meetings');

export default meetings;
