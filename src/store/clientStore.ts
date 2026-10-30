import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Client } from '../types';
import { SAMPLE_CLIENTS } from './sampleData';

interface ClientState {
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, updates: Partial<Omit<Client, 'id' | 'createdAt'>>) => void;
  deleteClient: (id: string) => void;
  resetClients: () => void;
  clearClients: () => void;
}

export const useClientStore = create<ClientState>()(
  persist(
    (set) => ({
      clients: SAMPLE_CLIENTS,
      addClient: (data) => {
        const newClient: Client = {
          ...data,
          id: `client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ clients: [newClient, ...state.clients] }));
        return newClient;
      },
      updateClient: (id, updates) =>
        set((state) => ({
          clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteClient: (id) =>
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        })),
      resetClients: () => set({ clients: SAMPLE_CLIENTS }),
      clearClients: () => set({ clients: [] }),
    }),
    {
      name: 'Egolepay-clients',
    }
  )
);
