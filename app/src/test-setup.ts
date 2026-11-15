import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Remove what one test drew before the next one starts.
afterEach(() => cleanup());
