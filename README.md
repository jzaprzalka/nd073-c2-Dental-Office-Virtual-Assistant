# Contoso Dentistry Virtual Assistant

This project implements a conversational virtual assistant for Contoso Dentistry. It gives users a natural-language interface for frequently asked questions and appointment-related requests. The solution combines Azure Custom Question Answering for FAQ responses, Conversational Language Understanding (CLU) for intent and date/time recognition, an appointment scheduler API, Azure Bot Service, and an Azure Static Web App with Web Chat.

## Submission summary

I followed the project in three main stages:

1. I created the bot and supporting Azure resources, because a Bot Framework application must receive activities through Azure Bot Service and expose a publicly reachable `/api/messages` endpoint.
2. I replaced the retired QnA Maker and LUIS services with their modern Language Service replacements: Custom Question Answering and CLU.
3. I deployed the conversation, scheduler, and website independently so each component could be scaled and deployed from its own folder.

The final architecture is:

```text
ContosoDentistryWebsite
        |
        | Direct Line short-lived token
        v
Azure Bot Service -> Azure App Service bot
                         |            |
                         |            +-> Custom Question Answering
                         |            +-> Conversational Language Understanding
                         |
                         +-> Dentist Scheduler App Service
```

### Why Azure Bot Service was used

Azure Bot Service was used as the channel and authentication bridge. It provides Direct Line/Web Chat channels and forwards messages to the bot's `/api/messages` endpoint. This is the same interface used by both Azure Web Chat and the public website.

### Why Custom Question Answering was used instead of QnA Maker

QnA Maker was retired on March 31, 2025. Custom Question Answering, a feature of Azure AI Language, provides the same FAQ-style knowledge-base capability and remains the supported service. The FAQ data from `starter/ContosoDentistryFAQs/FAQ.tsv` was imported into a Custom Question Answering project and deployed for bot queries.

### Why CLU was used instead of LUIS

LUIS was retired on October 1, 2025. CLU is the supported conversational language understanding service in Azure AI Language. It provides `CreateGetAvailability` and `ScheduleAppointment` intents and extracts date/time text for the scheduling flow.

The CLU project is also imported under [starter/DentistryLUIS/dentistry-luis.json](./starter/DentistryLUIS/dentistry-luis.json), with labeled and unlabeled JSON formats retained for project and import experiments.

### Why the scheduler was deployed separately

`ContosoDentistryScheduler` represents an external appointment API. It was kept separate from the bot App Service because it has a separate lifecycle, deployment workflow, and endpoint. The bot calls the scheduler's `/availability` and `/schedule` routes.

### Why Azure Static Web Apps was used

Azure Static Web Apps hosts the dentist website and provides integrated hosting for static content and an API Function. This allowed the Direct Line secret to remain outside the browser and repository. The API generates a short-lived Direct Line token instead of placing a secret in `index.html`.

No iframe secret or Bot App Password is committed to the repository.

## Services

- **ContosoDentistryChatBot:** Node.js and Bot Framework bot
- **Custom Question Answering:** FAQ answers about clinic policies and patient eligibility
- **CLU:** Recognizes `CreateGetAvailability` and `ScheduleAppointment`
- **ContosoDentistryScheduler:** Express API for availability and appointment requests
- **ContosoDentistryWebsite:** Azure Static Web App with dynamic Bot Framework Web Chat

## Local Setup

1. Install Node.js 22:

```bash
nvm install 22
nvm use 22
```

2. Copy the bot environment template:

```bash
cp starter/ContosoDentistryChatBot/.env.example starter/ContosoDentistryChatBot/.env
```

3. Configure the bot, Language resource, CLU deployment, and scheduler values in `.env`.

4. Install and start the scheduler:

```bash
cd starter/ContosoDentistryScheduler
npm install
npm start
```

5. Install and start the bot:

```bash
cd ../ContosoDentistryChatBot
npm install
npm start
```

The bot listens at `http://localhost:3978/api/messages`.

## Azure Deployment

The repository includes separate GitHub Actions workflows for the bot and scheduler App Services. The Static Web App deployment is generated under `.github/workflows/` and deploys the website and `api/` token Function.

Configure Azure App Service settings through Environment variables rather than committing secrets. Configure `DIRECT_LINE_SECRET` in the Static Web App environment for the Direct Line token API.

## Testing
- FAQ and scheduling conversations were tested through the bot and the website Web Chat UI.
- `GET /availability` and `POST /schedule` were tested against the scheduler.
- Azure logs were checked for authentication, routing, and request errors.

### Submission evidence

- [local_bot_testing.png](./local_bot_testing.png): local bot testing.
- [portal_bot_test.png](./portal_bot_test.png): bot testing screenshot filename prepared for the Azure Portal Web Chat submission.
- [website_bot_testing.png](./website_bot_testing.png): live Static Web App chat testing.
- [website_bot_test.png](./website_bot_test.png): exact filename requested by the project plan.
- [azure_bot_logs.png](./azure_bot_logs.png): Azure bot/application logging evidence.

The live website is [Contoso Dentistry on Azure Static Web Apps](https://gentle-grass-0a050970f.3.azurestaticapps.net/).

The live project uses Azure Static Web Apps, Azure App Service, Azure Bot Service, Azure AI Language, and Direct Line.

## Built With

- Node.js 22 and bot framework SDK for code and handling
- Azure Bot Service - Single point of contact for bot operations
- Azure AI Language Services | Custom Question Answering - In place of the retired QnA maker. Answers Common FAQs
- Azure AI Language Services | Conversational Language Understanding - The new version of LUIS for intent and entity recognition
- Azure Static Web Apps - to deploy the website
- Azure Functions - works under the website as API to provide atemporary token. Azure doesn't allow pushing secrets even development ones to GitHub

## License

[License](LICENSE.txt)
