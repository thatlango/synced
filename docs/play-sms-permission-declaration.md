# Synced Android SMS permission release note

Synced uses `READ_SMS` for its core SMS-based money-management function: importing mobile-money/bank transaction notifications into a user's personal finance ledger.

Release requirements:
- Declare the SMS permission use in Google Play Console and select the SMS-based money-management/budget tracking eligibility where available.
- The permission is optional at runtime; users can use Synced without enabling SMS import.
- Financial-message filtering and parsing occurs on-device. Normal sync uploads structured transaction candidates only (amount, debit/credit direction, merchant/description, provider, confidence and an idempotency fingerprint/provider reference).
- Raw SMS text and unrelated personal messages are not uploaded in the normal sync path.
- Do not add Call Log permissions.
- Privacy policy and Data safety answers must describe financial transaction processing and the optional SMS permission accurately.
