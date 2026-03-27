## Redirect Consent Demo

This demo creates a redirect consent request and opens the hosted OTP page in a popup.

### Run

1. Start API server:
   - `npm start`
2. Start demo page:
   - `npm run test:redirect`
3. Open:
   - `http://localhost:5501`

### How to use

- Fill:
  - `x-api-key`
  - `app_id`
  - `email`
  - `phone_number`
- Optional helper:
  - Click **Prefill policy/purpose** to fetch first purpose + active policy
- Click **Create Redirect URL + Open Popup**
- In popup:
  - Click **Send OTP**
  - Enter OTP and verify
  - Consent is granted
