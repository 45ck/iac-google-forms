import type { ReactNode } from 'react';

export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}: ButtonProps): JSX.Element {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: 'var(--space-2) var(--space-4)',
        backgroundColor: variant === 'primary' ? 'var(--color-interactive)' : 'transparent',
        color: variant === 'primary' ? 'white' : 'var(--color-interactive)',
        border: variant === 'secondary' ? '1px solid var(--color-interactive)' : 'none',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--font-size-base)',
      }}
    >
      {children}
    </button>
  );
}
