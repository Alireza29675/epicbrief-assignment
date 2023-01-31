// Loading the environment variables before anything else
import './loadEnv';

import dealsIntegration from './integrations/hubspot/deals';
import meetingsIntegration from './integrations/hubspot/meetings';
import meetings from './models/meetings';

// This is the main function that will be called by the cron job
const main = async () => {
  // Syncing and summarizing new meetings every 10 seconds
  //// NOTE: This is just for testing purposes, the correct way
  //// to do this is to use a proper cron job or webhooks which
  //// trigger the sync functions
  setInterval(cron, 10_000);
};

const cron = async () => {
  // Syncing with Hubspot at the beginning
  await meetingsIntegration.sync();
  await dealsIntegration.sync();

  // Adding summaries to all meetings
  await addSummaryToAllMeetingsWithoutSummary();
};

main();

// ------------------------------------------------------------
// 👇 DUMMY CODE BELOW - JUST FOR PRESENTING THE CONCEPT 👇
// ------------------------------------------------------------

// This is a dummy summarizer that just takes the first 10 words of the body
const dummySummarizer = (body: string) => {
  const words = body.split(' ');
  const summaryCount = Math.min(10, Math.floor(words.length / 2));
  return body.split(' ').slice(0, summaryCount).join(' ');
};

const addSummaryToAllMeetingsWithoutSummary = async () => {
  for (const meeting of meetings.data) {
    // If the meeting has a body but no summary, we need to generate one
    if (meeting.body.trim() && !meeting.summary.trim()) {
      // This is the dummy summarizer
      const summary = dummySummarizer(meeting.body);

      // Update the meeting with the new summary
      await meetings.update(meeting.id, {
        summary,
      });
    }
  }
};
