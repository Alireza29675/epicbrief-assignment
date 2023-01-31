// Loading the environment variables before anything else
import './loadEnv';
import dealsIntegration from './integrations/hubspot/deals';

setInterval(() => {
  dealsIntegration.sync();
}, 10_000);
