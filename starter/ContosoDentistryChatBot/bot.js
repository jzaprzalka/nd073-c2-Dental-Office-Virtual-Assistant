// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityHandler, MessageFactory } from 'botbuilder';

import { CustomQuestionAnswering } from 'botbuilder-ai';
import DentistScheduler from './dentistscheduler.js';
import IntentRecognizer from './intentrecognizer.js';

class DentaBot extends ActivityHandler {
    constructor(configuration, qnaOptions) {
        // call the parent constructor
        super();
        if (!configuration) throw new Error('[QnaMakerBot]: Missing parameter. configuration is required');

        // Create the Question Answering connector only when it has been configured.
        const qna = configuration.QnAConfiguration;
        if (qna && qna.knowledgeBaseId && qna.endpointKey && qna.host) {
            this.QnAMaker = new CustomQuestionAnswering(qna, qnaOptions);
        } else {
            throw new Error('[QnaMakerBot]: QnA Maker (Custom Question Answering) is not configured.');
        }
       
        // create a DentistScheduler connector
        this.DentistScheduler = new DentistScheduler(configuration.SchedulerConfiguration);
      
        // Create an IntentRecognizer connector for CLU.
        this.IntentRecognizer = new IntentRecognizer(configuration.CluConfiguration);


        this.onMessage(async (context, next) => {
            // send user input to QnA Maker and collect the response in a variable
            const qnaResponse = await this.QnAMaker.getAnswers(context);
            console.log("QnA Maker response: ", qnaResponse);
            const limit = qnaResponse?.at(0)?.score || 0.5;
          
            // Send user input to CLU and use the top intent for scheduling decisions.
            const cluResult =  await this.IntentRecognizer.executeCluQuery(context);
            console.log("CLU result: ", cluResult);

            const topIntent = this.IntentRecognizer.getTopIntent(cluResult);
            const intentScore = this.IntentRecognizer.getIntentScore(cluResult, topIntent);

            if (topIntent === 'CreateGetAvailability' && intentScore > limit) {
                await context.sendActivity(await this.DentistScheduler.getAvailability());
            } else if (topIntent === 'ScheduleAppointment' && intentScore > limit) {
                const time = this.IntentRecognizer.getTimeEntity(cluResult);
                if (time) {
                    await context.sendActivity(await this.DentistScheduler.scheduleAppointment(time));
                } else {
                    await context.sendActivity('What date and time would you like for your appointment?');
                }
            }
            // Fall back to Custom Question Answering.
            else if (qnaResponse && qnaResponse.length > 0) {
                await context.sendActivity(qnaResponse[0].answer);
            } else {
                await context.sendActivity(
                    'Sorry, I did not understand that. Please ask about office FAQs or appointment scheduling.'
                );
            }
             
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            //write a custom greeting
            const welcomeText = 'Hello and welcome to the dentistry Bot. My name is Bot. How May I assist You? Want to schedule a visit? Want to know more about the clinic?';
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            // by calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

const _DentaBot = DentaBot;
export { _DentaBot as DentaBot };
