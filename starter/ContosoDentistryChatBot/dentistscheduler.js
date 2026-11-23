class DentistScheduler {
    constructor(configuration) {
        const baseUrl = String(configuration.SchedulerEndpoint || '').replace(/\/$/, '');

        this.getAvailability = async () => {
            const response = await fetch(`${baseUrl}/availability`);
            if (!response.ok) {
                throw new Error(`Scheduler availability request failed with status ${response.status}`);
            }

            const times = await response.json();
            let responseText = 'Current time slots available:';
            times.map(time => {
                responseText += `
${time}`
            });
            return responseText;
        }

        this.scheduleAppointment = async (time) => {
            const response = await fetch(`${baseUrl}/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ time })
            });
            if (!response.ok) {
                throw new Error(`Scheduler appointment request failed with status ${response.status}`);
            }

            return `An appointment is set for ${time}.`;
        }
    }
}

export default DentistScheduler