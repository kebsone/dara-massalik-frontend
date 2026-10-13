# Dara Massalik - frontend/backend connection

## Development URLs
- Angular: http://localhost:4200
- Spring Boot: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

## Login
Use:
- Email: admin@daramassalik.local
- Password: ChangeMe123!

The login calls `POST /api/auth/login`, stores the JWT, and the HTTP interceptor sends `Authorization: Bearer <token>` for subsequent API calls.

## Generate the Angular API client
With the backend running:

```bash
npm run api:generate
```
