# Authentification Dara Massalik

## User flow

The default login method is phone OTP. The password form remains available for administrative/legacy accounts.

```text
Phone number
   -> OTP
   -> existing account: sign in
   -> unknown account: first name + last name (+ optional email) -> create MEMBER account
```

The backend returns a 15-minute access token and a 30-day refresh token. The interceptor refreshes the access token automatically after a 401 response.

For local development, `OTP_EXPOSE_DEV_CODE=true` makes the backend include the OTP in the response and the frontend displays it clearly as a development-only code. Disable it before any shared or production deployment.

## API generation

Start the backend first, then run:

```bash
npm run api:generate
```

This exports `/v3/api-docs` and generates a TypeScript Angular client under `src/app/core/api/generated`.

The handwritten adapters/stores remain separate so generated files can be safely regenerated.
