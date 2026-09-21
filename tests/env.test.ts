import { describe, expect, it } from 'vitest';
import { envConvention } from '../src/utils/env.js';
import { nestJsx } from '../src/utils/jsx.js';

describe('envConvention', () => {
  it('uses import.meta.env for a Vite web app', () => {
    const c = envConvention({ framework: 'react', target: 'web' });
    expect(c.prefix).toBe('VITE_');
    expect(c.read('API_URL')).toBe('import.meta.env.VITE_API_URL');
    expect(c.usesImportMeta).toBe(true);
  });

  it('uses process.env for a Next web app', () => {
    const c = envConvention({ framework: 'next', target: 'web' });
    expect(c.prefix).toBe('NEXT_PUBLIC_');
    expect(c.read('API_URL')).toBe('process.env.NEXT_PUBLIC_API_URL');
  });

  // The Expo app used to inherit the web app's convention, which does not
  // exist under Metro. Target must win over framework.
  it.each(['react', 'next'] as const)(
    'uses EXPO_PUBLIC_ for an expo target regardless of framework (%s)',
    (framework) => {
      const c = envConvention({ framework, target: 'expo' });
      expect(c.prefix).toBe('EXPO_PUBLIC_');
      expect(c.read('SUPABASE_URL')).toBe('process.env.EXPO_PUBLIC_SUPABASE_URL');
      expect(c.usesImportMeta).toBe(false);
    },
  );
});

describe('nestJsx', () => {
  it('returns the inner expression when there are no wrappers', () => {
    expect(nestJsx('<App />', [], '    ')).toBe('<App />');
  });

  it('nests a single wrapper', () => {
    expect(nestJsx('<App />', [['P', 'P']], '  ')).toBe('<P>\n    <App />\n  </P>');
  });

  it('indents each level by two spaces, outermost first', () => {
    const out = nestJsx(
      '<App />',
      [
        ['A', 'A'],
        ['B', 'B'],
      ],
      '',
    );
    expect(out).toBe('<A>\n  <B>\n    <App />\n  </B>\n</A>');
  });
});
