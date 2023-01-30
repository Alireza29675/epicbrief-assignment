export type Integrations = 'hubspot'; // | 'other' | 'integrations'

export interface IRelatedTo {
  id: string;
  type: Integrations;
}
