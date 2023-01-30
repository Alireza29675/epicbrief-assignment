import Collection from './utils/Collection';

interface IDeal {
  id: string;
  name: string;
  amount: number;
}

class Deals extends Collection<IDeal> {
  collectionName = 'deals';

  constructor() {
    super();
    console.log(this.data);
  }
}

export default new Deals();
