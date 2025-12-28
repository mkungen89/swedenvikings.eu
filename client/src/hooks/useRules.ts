import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// Types
interface Rule {
  id: string;
  title: string;
  content: string;
  category: string;
  order: number;
  isActive: boolean;
}

// We need to add a rules endpoint to the backend, for now we'll fetch from a static endpoint
// or use the existing data structure

export function useRules() {
  return useQuery({
    queryKey: ['rules'],
    queryFn: async () => {
      // For now, we'll return rules from the database
      // The backend needs a public rules endpoint
      try {
        const response = await api.get('/rules');
        return response.data.data as Rule[];
      } catch {
        // Return default rules if endpoint doesn't exist yet
        return [
          {
            id: '1',
            title: 'Respektera andra spelare',
            content: 'Alla spelare ska behandlas med respekt. Kränkningar, rasism, sexism eller annan diskriminering tolereras inte.',
            category: 'general',
            order: 1,
            isActive: true,
          },
          {
            id: '2',
            title: 'Ingen fuskning',
            content: 'Användning av hacks, exploits eller andra fuskmetoder är strängt förbjudet och leder till permanent ban.',
            category: 'general',
            order: 2,
            isActive: true,
          },
          {
            id: '3',
            title: 'Följ rollspelsregler',
            content: 'På vår server spelar vi med realism i fokus. Följ de rollspelsregler som gäller för respektive scenario.',
            category: 'gameplay',
            order: 3,
            isActive: true,
          },
          {
            id: '4',
            title: 'Kommunicera på svenska eller engelska',
            content: 'All kommunikation ska ske på svenska eller engelska för att alla ska kunna förstå.',
            category: 'communication',
            order: 4,
            isActive: true,
          },
        ];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

