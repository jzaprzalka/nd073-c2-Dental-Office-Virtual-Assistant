import { app } from '@azure/functions';

app.http('directLineToken', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'directline-token',
    handler: async (request, context) => {
        const secret = process.env.DIRECT_LINE_SECRET;
        if (!secret) {
            context.error('DIRECT_LINE_SECRET is not configured');
            return { status: 500, jsonBody: { error: 'Chat service is not configured' } };
        }

        try {
            const response = await fetch(
                'https://directline.botframework.com/v3/directline/tokens/generate',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${secret}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ user: { id: 'anonymous-user' } })
                }
            );

            if (!response.ok) {
                const details = await response.text();
                context.error(`Direct Line token request failed: ${response.status} ${details}`);
                return { status: 502, jsonBody: { error: 'Unable to connect to the chat service' } };
            }

            const result = await response.json();
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store'
                },
                jsonBody: { token: result.token }
            };
        } catch (error) {
            context.error(error);
            return { status: 502, jsonBody: { error: 'Unable to connect to the chat service' } };
        }
    }
});
