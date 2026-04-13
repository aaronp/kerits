import { Providers } from '@/components/providers';
import type { ReactNode } from 'react';

export default function DocsGroupLayout({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
