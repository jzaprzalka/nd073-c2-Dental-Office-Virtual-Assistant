class IntentRecognizer {
    constructor(config) {
        this.projectName = config && config.projectName;
        this.deploymentName = config && config.deploymentName;
        this.apiKey = config && config.apiKey;
        this.endpoint = config && config.endpoint;
        this.configured = Boolean(
            this.projectName &&
            this.deploymentName &&
            this.apiKey &&
            this.endpoint
        );
        if (!this.configured)
            throw new Error('[IntentRecognizer]: Missing parameter. Intent Recognizer is not configured.');
    }

    async executeCluQuery(context) {
        const endpoint = this.endpoint.replace(/\/$/, '');
        const response = await fetch(
            `${endpoint}/language/:analyze-conversations?api-version=2023-04-01`,
            {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    kind: 'Conversation',
                    analysisInput: {
                        conversationItem: {
                            id: '1',
                            text: context.activity.text,
                            modality: 'text',
                            language: 'en',
                            participantId: 'user'
                        }
                    },
                    parameters: {
                        projectName: this.projectName,
                        deploymentName: this.deploymentName,
                        stringIndexType: 'Utf16CodeUnit',
                        verbose: true
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`CLU request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.result && data.result.prediction
            ? data.result.prediction
            : undefined;
    }

    getTopIntent(result) {
        return result && result.topIntent ? result.topIntent : undefined;
    }

    getIntentScore(result, intent) {
        if (!result || !Array.isArray(result.intents)) return 0;
        const match = result.intents.find(item => item.category === intent);
        return match ? match.confidenceScore : 0;
    }

    getTimeEntity(result) {
        if (!result || !Array.isArray(result.entities)) return undefined;

        const datetimeEntity = result.entities.find(entity =>
            entity.category === 'appointmentDateTime' ||
            entity.category === 'datetime' ||
            entity.category === 'DateTime'
        );

        return datetimeEntity ? datetimeEntity.text : undefined;
    }
}

export default IntentRecognizer;
