const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const twilio = require('twilio');

initializeApp();
const db = getFirestore();

/**
 * Send SMS to admin phone numbers when a new incident is created
 */
exports.onNewIncident = onDocumentCreated('incidents/{incidentId}', async (event) => {
    // Read env vars at runtime (not at module load)
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    const adminPhoneNumbers = (process.env.ADMIN_PHONE_NUMBERS || '').split(',').filter(Boolean);

    const snapshot = event.data;
    if (!snapshot) {
        console.log('No data in event');
        return null;
    }

    const incident = snapshot.data();
    const incidentId = event.params.incidentId;

    console.log('New incident created:', incidentId);
    console.log('Incident data:', JSON.stringify(incident));
    console.log('Twilio SID present:', !!twilioAccountSid);
    console.log('Twilio Auth Token present:', !!twilioAuthToken);
    console.log('Twilio Phone present:', !!twilioPhoneNumber);
    console.log('Admin phones:', adminPhoneNumbers);

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
        console.error('Twilio credentials not configured. Env check:', {
            hasSID: !!twilioAccountSid,
            hasAuth: !!twilioAuthToken,
            hasPhone: !!twilioPhoneNumber,
            allEnvKeys: Object.keys(process.env).filter(k => k.startsWith('TWILIO') || k.startsWith('ADMIN'))
        });
        return null;
    }

    if (adminPhoneNumbers.length === 0) {
        console.warn('No admin phone numbers configured');
        return null;
    }

    const client = twilio(twilioAccountSid, twilioAuthToken);

    // Format the SMS message
    const typeEmoji = {
        flood: '🌊',
        landslide: '⛰️',
        medical: '🏥',
        trapped: '🆘',
        other: '⚠️'
    };

    const emoji = typeEmoji[incident.type] || '⚠️';
    const message = `${emoji} NEW SOS ALERT

Type: ${incident.type?.toUpperCase()}
Name: ${incident.name}
Phone: ${incident.phone}
Location: ${incident.address || `${incident.location?.latitude?.toFixed(4)}, ${incident.location?.longitude?.toFixed(4)}`}

${incident.description}

Navigate: https://www.google.com/maps/dir/?api=1&destination=${incident.location?.latitude},${incident.location?.longitude}

- RescueHQ`;

    console.log('Sending SMS to:', adminPhoneNumbers);

    // Send SMS to all admin phone numbers
    const sendPromises = adminPhoneNumbers.map(async (toNumber) => {
        try {
            console.log(`Attempting to send SMS to ${toNumber.trim()}`);
            const result = await client.messages.create({
                body: message,
                from: twilioPhoneNumber,
                to: toNumber.trim()
            });
            console.log(`SMS sent to ${toNumber}: ${result.sid}`);
            return result;
        } catch (error) {
            console.error(`Failed to send SMS to ${toNumber}:`, error.message);
            console.error('Full error:', JSON.stringify(error));
            return null;
        }
    });

    const results = await Promise.all(sendPromises);
    console.log('SMS results:', results.map(r => r?.sid || 'failed'));

    // Update the incident to mark that notification was sent
    try {
        await snapshot.ref.update({
            notificationSent: true,
            notificationSentAt: FieldValue.serverTimestamp()
        });
        console.log('Incident updated with notification status');
    } catch (updateError) {
        console.error('Failed to update incident:', updateError.message);
    }

    return null;
});

/**
 * Send SMS when incident status changes to in-progress
 */
exports.onStatusChange = onDocumentUpdated('incidents/{incidentId}', async (event) => {
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    if (!beforeData || !afterData) return null;

    // Only trigger if status changed
    if (beforeData.status === afterData.status) {
        return null;
    }

    console.log('Status changed:', beforeData.status, '->', afterData.status);

    // Only notify the victim when status changes to in-progress
    if (afterData.status === 'in-progress' && afterData.phone) {
        if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
            console.error('Twilio credentials not configured for status update');
            return null;
        }

        const client = twilio(twilioAccountSid, twilioAuthToken);

        const message = `🚨 RescueHQ Update

Your SOS request is now IN PROGRESS.

A rescue team has been dispatched to your location. 

Stay calm and remain in a safe position if possible.

- RescueHQ Emergency Response`;

        try {
            const result = await client.messages.create({
                body: message,
                from: twilioPhoneNumber,
                to: afterData.phone
            });
            console.log(`Status update SMS sent to ${afterData.phone}: ${result.sid}`);
        } catch (error) {
            console.error(`Failed to send status update SMS:`, error.message);
        }
    }

    return null;
});
