import getCollection, { Collection } from './utils/getCollection';

interface IIntegration {
  service: string;
  idInFirebase: string;
  idInService: string;
}

const integrations = getCollection<IIntegration>(
  'integrations'
) as Collection<IIntegration>;

export default integrations;
