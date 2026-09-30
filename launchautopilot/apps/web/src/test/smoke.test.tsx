import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Page from '@/app/page';

describe('Page', () => {
  it('renders the welcome heading', () => {
    render(<Page />);
    expect(screen.getByRole('heading', { name: /welcome to xocket/i })).toBeInTheDocument();
  });
});
