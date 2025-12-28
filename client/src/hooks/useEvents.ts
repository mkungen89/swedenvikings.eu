import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Types
interface Organizer {
  id: string;
  username: string;
  avatar?: string;
}

interface Participant {
  userId: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  status: 'going' | 'maybe' | 'not_going';
  joinedAt: string;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  image?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  maxParticipants?: number;
  participantCount?: number;
  isPublished: boolean;
  organizer: Organizer;
  participants?: Participant[];
  createdAt: string;
  updatedAt: string;
}

interface EventsListResponse {
  success: boolean;
  data: Event[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateEventData {
  title: string;
  description: string;
  content: string;
  startDate: string;
  endDate?: string;
  location?: string;
  maxParticipants?: number;
  image?: string;
  isPublished?: boolean;
}

interface UpdateEventData extends Partial<CreateEventData> {
  id: string;
}

// Hooks
export function useEventsList(page = 1, limit = 10, past = false) {
  return useQuery({
    queryKey: ['events', 'list', page, limit, past],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        past: past.toString(),
      });
      const response = await api.get<EventsListResponse>(`/events?${params}`);
      return response.data;
    },
  });
}

export function useEvent(slug: string) {
  return useQuery({
    queryKey: ['events', 'detail', slug],
    queryFn: async () => {
      const response = await api.get(`/events/${slug}`);
      return response.data.data as Event;
    },
    enabled: !!slug,
  });
}

export function useJoinEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ slug, status = 'going' }: { slug: string; status?: 'going' | 'maybe' | 'not_going' }) => {
      const response = await api.post(`/events/${slug}/join`, { status });
      return response.data.data;
    },
    onSuccess: (_, { slug }) => {
      queryClient.invalidateQueries({ queryKey: ['events', 'detail', slug] });
      queryClient.invalidateQueries({ queryKey: ['events', 'list'] });
    },
  });
}

export function useLeaveEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (slug: string) => {
      await api.delete(`/events/${slug}/leave`);
    },
    onSuccess: (_, slug) => {
      queryClient.invalidateQueries({ queryKey: ['events', 'detail', slug] });
      queryClient.invalidateQueries({ queryKey: ['events', 'list'] });
    },
  });
}

// Admin hooks
export function useCreateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateEventData) => {
      const response = await api.post('/events', data);
      return response.data.data as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateEventData) => {
      const response = await api.patch(`/events/${id}`, data);
      return response.data.data as Event;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.setQueryData(['events', 'detail', data.slug], data);
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

