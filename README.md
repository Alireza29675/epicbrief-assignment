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
- Run npm install to install the dependencies.
- Start the project by running npm run dev and enjoy the real-time sync!

## Considerations

- **Code Consistency and Formatting:** ESLint, Lintstaged, and Prettier are used to ensure that the code is consistently formatted and well-structured. Husky is configured to run the `npm run test` each time a new commit is made, and to lint everything before the code is pushed to the remote branch.

- **Secure Push to Open Source Repo:** The `.env` file keeps important secrets away from the code, so the project can be securely pushed to an open source repo. The env variables can also be set using **Docker or any CI system**, making the app compatible with these systems.

- **Conventional Commits:** All commits follow [conventional commits](https://www.conventionalcommits.org), which are in the format of `"[feat|chore|fix|...]([scope]): [message]"`. This makes it easier and more reliable to read the commits, especially in production-ready projects.

- **Reusable Functions and Utils:** The project is made up of reusable functions and utilities that can be used in production. For example, `getCollection()` is a utility that creates a connection with Firebase, handles type-safing, acts as an ORM, and keeps the data synced with Firebase if the sync flag is set to true. getCollection was used to create models for deals and meetings as described in the task description.
