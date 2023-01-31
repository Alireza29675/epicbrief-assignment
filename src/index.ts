// Loading the environment variables before anything else
import './loadEnv';
import dealsIntegration from './integrations/hubspot/deals';
import meetingsIntegration from './integrations/hubspot/meetings';

dealsIntegration.sync();
meetingsIntegration.sync();
