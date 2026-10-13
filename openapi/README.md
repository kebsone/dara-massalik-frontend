# OpenAPI client

The backend exposes the live OpenAPI contract at:

- `http://localhost:8080/v3/api-docs`
- `http://localhost:8080/v3/api-docs.yaml`

Swagger UI:

- `http://localhost:8080/swagger-ui.html`

Export and generate the Angular client:

```bash
npm run api:generate
```

The script first saves the live document to `openapi/openapi.json`, then invokes the official `typescript-angular` OpenAPI Generator into `src/app/core/api/generated`.

The current login flow is already connected to the backend through `AuthApiService`; this keeps the UI working immediately while the generated client is produced from the live contract.
