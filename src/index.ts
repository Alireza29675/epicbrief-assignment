// Loading the environment variables before anything else
import './loadEnv';
import deals from './models/deals';

deals.ready.then(() => console.log(deals.data));
