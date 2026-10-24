import '@testing-library/jest-dom';
import { installTraceHooks } from '@tstapleton/plotline/jest';
import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';

setupZonelessTestEnv();
installTraceHooks();
