// app/ClientProvider.tsx
'use client';

import { Provider } from 'react-redux';
import { store } from './store/store'; // Adjust path as necessary

export default function ClientProvider({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
}
