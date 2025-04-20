# Facebook Lead Form Webhook Integration

This Django app integrates Facebook Lead Forms with your CRM system using Albato as a third-party service. When a user fills out a Facebook lead form, the data is sent to Albato, which then forwards it to this webhook endpoint.

## How It Works

1. A user fills out a Facebook lead form
2. Facebook sends the lead data to Albato
3. Albato forwards the data to our webhook endpoint
4. The webhook endpoint processes the data and creates a new lead in the CRM system
5. The webhook history is stored for auditing and debugging purposes

## Setup Instructions

### 1. Configure Albato

1. Sign up for Albato (https://albato.com)
2. Create a new integration between Facebook Lead Forms and a Webhook
3. Configure the webhook URL to point to your CRM endpoint:
   ```
   https://yourcrmdomain.com/api/webhook/facebook/<tenant_id>/
   ```
   Replace `<tenant_id>` with the UUID of the tenant you want to create leads for.

### 2. Configure Facebook Lead Form

1. Make sure your Facebook lead form collects at least these fields:
   - Name
   - Email
   - Phone number
   - Any other fields relevant to your lead process

### 3. Test the Integration

1. Submit a test lead through your Facebook form
2. Check the webhook history in your CRM admin panel
3. Verify that the lead was created correctly in your CRM

## API Endpoints

### Webhook Endpoint
- **URL**: `/api/webhook/facebook/<tenant_id>/`
- **Method**: POST
- **Auth Required**: No (webhook is public)
- **Description**: Receives lead data from Albato and creates a lead in the CRM

### Admin Endpoints
- **List Webhook History**: `/api/webhook/facebook/history/`
- **View Webhook Details**: `/api/webhook/facebook/history/<uuid:pk>/`
- **Auth Required**: Yes (user must be authenticated)
- **Description**: View webhook history for debugging and auditing purposes

## Customization

You may need to customize the `FacebookLeadWebhookSerializer.create()` method to map the fields from the Facebook lead form to your CRM lead model, as the structure of the data sent by Albato may vary.

## Troubleshooting

If leads are not being created correctly:

1. Check the webhook history records for errors
2. Verify that the tenant ID is correct
3. Make sure the lead form fields are being mapped correctly
4. Check the server logs for any exceptions 