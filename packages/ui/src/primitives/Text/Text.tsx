import { type ReactElement, type ReactNode } from 'react';

export interface TextProps {
  children: ReactNode;
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4';
  size?: 'sm' | 'base' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'bold';
}

export function Text({
  children,
  as: Component = 'p',
  size = 'base',
  weight = 'normal',
}: TextProps): ReactElement {
  return (
    <Component
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: `var(--font-size-${size})`,
        fontWeight: `var(--font-weight-${weight})`,
        color: 'var(--color-text)',
        margin: 0,
      }}
    >
      {children}
    </Component>
  );
}
