import { Client } from '@hubspot/api-client';

export default new Client({ accessToken: process.env.HUBSPOT_API_KEY });
