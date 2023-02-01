<p>&nbsp;</p>
<p align="center" style="margin: 3rem"><img src="https://user-images.githubusercontent.com/2771377/216113406-ab201265-51a1-45af-9c27-401a0665122b.png" width="400" /></p>
<p>&nbsp;</p>

# Technical Documentation - Task One

## Introduction

This technical documentation covers the implementation details of the simple integration made as a part of the interviewing process with Epicbrief company. The goal of this integration is to connect Firebase with another service such as Hubspot in a stable and extensible manner.

## Setup

To setup the project, follow these steps:

- Clone the repository to your local machine.
- Copy the file .env.example and create a new file .env.
- Fill in the required variables in the .env file. _If you need the file I am using, please feel free to ask me for it._
- Run `npm install` to install the dependencies.
- Start the project by running `npm run dev` and enjoy the real-time sync!

## Considerations

- **Code Consistency and Formatting:** ESLint, Lintstaged, and Prettier are used to ensure that the code is consistently formatted and well-structured. Husky is configured to run the `npm run test` each time a new commit is made, and to lint everything before the code is pushed to the remote branch.

- **Secure Push to Open Source Repo:** The `.env` file keeps important secrets away from the code, so the project can be securely pushed to an open source repo. The env variables can also be set using **Docker or any CI system**, making the app compatible with these systems.

- **Conventional Commits:** All commits follow [conventional commits](https://www.conventionalcommits.org), which are in the format of `"[feat|chore|fix|...]([scope]): [message]"`. This makes it easier and more reliable to read the commits, especially in production-ready projects.

- **Reusable Functions and Utils:** The project is made up of reusable functions and utilities that can be used in production. For example, `getCollection()` is a utility that creates a connection with Firebase, handles type-safing, acts as an ORM, and keeps the data synced with Firebase if the sync flag is set to true. getCollection was used to create models for deals and meetings as described in the task description.

## Folder Structure

Heart of the project is located in the `/src` folder and it consists of the following subfolders:

- `/services`: This folder contains the API implementation for working with different services, including firebase and hubspot. The architecture is designed to follow the **dependency inversion principle** and ensures the project's stability even if the service is changed or if we upgrade to a newer API version. The API implementation can be easily configured, while keeping the internal interface the same.

- `/models`: This folder contains the main database in firebase, where the models are the collections in firebase. Each model is responsible for performing CRUD operations on the corresponding collection in firebase. A `getCollection()` utility function is provided to make it easy to connect to firebase collections by simply providing a string value, which is the collection name.

- `/integrations`: The `createIntegration()` utility function provides a unified strategy for creating **two-way sync** between firebase and a service. Due to the various ways of working with different services, a general-purpose interface is provided that receives functions defining how to create, update, delete, or fetch data from the service. The files `src/integrations/hubspot/deals.ts` and `src/integrations/hubspot/meetings.ts` contain all the necessary implementations for the task description and they are using the `createIntegration()` utility function.

Here's a sample code for creating a new integration:

```ts
createIntegration({
  model: modelObject,
  service: {
    name: 'service/scope',
    fetch: async () => {
      // How can we fetch data from the service?
    },
    create: async (data) => {
      // How can we create a new item in the service?
    },
    delete: async (id) => {
      // How can we delete an item from the service?
    }
    update: async (id, data) => {
      // How can we update an item in the service?
    },
  },
});
```

Using this method it would be also easy to define services a separated files or package and use them in `createIntegration`. **As I mentioned above, the code architecture is designed to extend and upgrade easily.**

## `createIntegration()` Utility

Due to the importance of the `createIntegration()` utility function, it is worth mentioning it in more detail:

The `createIntegration()` function is responsible for creating a **two-way sync** between firebase and a service (in this case, Hubspot). When you call `hubspotDeals.sync()`, it performs the following steps to ensure the data is in sync:

- Fetches the data from both firebase and the service.
- Fetches all the related integration items from a middle-collection called `integrations`, which keeps track of the connections between items in firebase and items in the service.
- Then it decides what to do based on the following cases:
  - If there is no integration item for an item in firebase, the function creates an identical item in the service and creates an integration item to remember the syncing.
  - If there is no integration item for an item in the service, the function creates an identical item in firebase and creates an integration item to remember the syncing.
  - If the `_updatedAt` in the connection item (from integrations collection) is newer than both of firebase and the service, then it means the data is already in sync and no further action is needed.
  - If the `_updatedAt` in one or two items are newer than the integration itself, it means that one of the items has been updated recently. The function then compares both items and updates the outdated one, as well as the integration item.
  - If there is an integration but one of the items doesn't exist, it means that the other has been removed. In this case, the function removes the existing object and its related integration item.
