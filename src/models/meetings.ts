import getCollection from './utils/getCollection';

interface IMeeting {
  summary: string;
  body: string;
}

const meetings = getCollection<IMeeting>('meetings');

export default meetings;
