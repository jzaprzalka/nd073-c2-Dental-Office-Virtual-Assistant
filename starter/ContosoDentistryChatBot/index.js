// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { config } from 'dotenv';
// Import required bot configuration.
const ENV_FILE = join(dirname(fileURLToPath(import.meta.url)), '.env');
config({ path: ENV_FILE });

import { createServer, plugins } from 'restify';

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import { CloudAdapter, ConfigurationBotFrameworkAuthentication } from 'botbuilder';

// This bot's main dialog.
import { DentaBot } from './bot.js';

// Create HTTP server
const server = createServer();
server.use(plugins.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

// Create the Bot Framework authentication and CloudAdapter.
const botFrameworkAuthentication =
    new ConfigurationBotFrameworkAuthentication(process.env);
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${error}`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${error}`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Map configuration values values from .env file into the required format for each service.
const QnAConfiguration = {
    knowledgeBaseId: process.env.ProjectName,
    endpointKey: process.env.LanguageEndpointKey,
    host: process.env.LanguageEndpointHostName
};

const CluConfiguration = {
    projectName: process.env.CluProjectName,
    deploymentName: process.env.CluDeploymentName,
    apiKey: process.env.CluAPIKey,
    endpoint: process.env.CluAPIHostName
}

const SchedulerConfiguration = {
    SchedulerEndpoint: process.env.SchedulerEndpoint
}
//pack each service configuration into 
const configuration = {
    QnAConfiguration,
    CluConfiguration,
    SchedulerConfiguration
}

// Create the main dialog.
const myBot = new DentaBot(configuration, {});

// Listen for incoming requests.
server.post('/api/messages', async (req, res) => {
    await adapter.process(req, res, async (context) => {
        await myBot.run(context);
    });
});
