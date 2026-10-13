import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

mkdirSync('openapi', { recursive: true });

execFileSync('curl', [
  '--fail',
  'http://localhost:8080/v3/api-docs',
  '-o',
  'openapi/openapi.json'
], { stdio: 'inherit' });

execFileSync('npx', [
  '--yes',
  '@openapitools/openapi-generator-cli',
  'generate',
  '-i', 'openapi/openapi.json',
  '-g', 'typescript-angular',
  '-o', 'src/app/core/api/generated',
  '--additional-properties=providedIn=root,ngVersion=20,withInterfaces=true,useSingleRequestParameter=true,modelPropertyNaming=camelCase'
], { stdio: 'inherit' });
