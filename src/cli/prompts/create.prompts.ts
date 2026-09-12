import * as p from '@clack/prompts';
import pc from 'picocolors';

export async function collectCreateAnswers({ initialName }: { initialName?: string } = {}): Promise<any> {
  const answers = await p.group(
    {
      projectName: () =>
        p.text({
          message: 'Project name:',
          placeholder: 'my-app',
          initialValue: initialName || 'my-app',
          validate: (v) => {
            if (!v || v.trim().length === 0) return 'Project name is required.';
            if (!/^[a-z0-9-_]+$/i.test(v.trim()))
              return 'Use only letters, numbers, hyphens, or underscores.';
          },
        }),

      framework: () => 
        p.select({
          message: 'Framework:',
          options: [
            { value: 'react', label: 'React', hint: 'Vite + React' },
            { value: 'next', label: 'Next.js', hint: 'App Router' },
          ],
          initialValue: 'react',
        } as any),

      stateManagement: () =>
        p.select({
          message: 'State management:',
          hint: 'Global client-side state',
          options: [
            { value: 'zustand', label: 'Zustand', hint: 'recommended' },
            { value: 'context', label: 'React Context' },
            { value: 'redux', label: 'Redux Toolkit' },
            { value: 'none', label: 'None' },
          ],
          initialValue: 'zustand',
        } as any),

      serverState: () =>
        p.select({
          message: 'Server state:',
          hint: 'API / async data management',
          options: [
            { value: 'tanstack', label: 'TanStack Query', hint: 'recommended' },
            { value: 'none', label: 'None' },
          ],
          initialValue: 'tanstack',
        } as any),

      backend: () =>
        p.select({
          message: 'Backend / Authentication:',
          options: [
            { value: 'supabase', label: 'Supabase', hint: 'recommended' },
            { value: 'cognito', label: 'AWS Cognito', hint: 'Amplify v6' },
            { value: 'custom', label: 'Custom API', hint: 'Axios-based stubs' },
            { value: 'none', label: 'None' },
          ],
          initialValue: 'supabase',
        } as any),
    },
    {
      onCancel: () => {
        p.cancel(pc.yellow('Operation cancelled.'));
        process.exit(0);
      },
    },
  );

  return answers;
}
