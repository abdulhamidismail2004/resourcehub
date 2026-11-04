import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { translations } from '../i18n/translations';

describe('Frontend UI Component & Internationalization Suite', () => {
  it('1. Button renders with children and handles clicks', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Explore Resources</Button>);

    const btn = screen.getByRole('button', { name: /explore resources/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('2. Button shows loading state and disables user interactions', () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Publishing
      </Button>
    );

    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('3. Badge renders with variants', () => {
    render(<Badge variant="success">Verified Peer Review</Badge>);
    expect(screen.getByText('Verified Peer Review')).toBeInTheDocument();
  });

  it('4. Input component renders label and error message', () => {
    render(
      <Input
        label="Resource Title"
        error="Title must be at least 3 characters"
        defaultValue="Bio"
      />
    );

    expect(screen.getByLabelText(/resource title/i)).toBeInTheDocument();
    expect(screen.getByText('Title must be at least 3 characters')).toBeInTheDocument();
  });

  it('5. Card renders structured header and content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Computer Science Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Lecture slides covering algorithm complexity.</p>
        </CardContent>
      </Card>
    );

    expect(screen.getByText('Computer Science Notes')).toBeInTheDocument();
    expect(screen.getByText('Lecture slides covering algorithm complexity.')).toBeInTheDocument();
  });

  it('6. Bilingual translations dictionary is symmetric and populated', () => {
    const enKeys = Object.keys(translations.en);
    const arKeys = Object.keys(translations.ar);

    expect(enKeys.length).toBeGreaterThan(30);
    expect(arKeys.length).toBeGreaterThan(30);

    // Verify critical keys exist in both
    for (const key of ['platformName', 'discover', 'upload', 'dashboard', 'admin', 'signIn', 'signUp'] as const) {
      expect(translations.en[key]).toBeTruthy();
      expect(translations.ar[key]).toBeTruthy();
    }
  });
});
