import '@testing-library/jest-dom';
import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';
import { deserialize, serialize } from 'node:v8';

// jsdom doesn't provide structuredClone; Node's serializer does the same job.
globalThis.structuredClone ??= <T>(value: T): T => deserialize(serialize(value));

setupZonelessTestEnv();
