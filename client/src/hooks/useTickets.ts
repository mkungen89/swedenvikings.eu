import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Types
interface User {
  id: string;
  username: string;
  avatar?: string;
}

interface TicketMessage {
  id: string;
  content: string;
  isStaff: boolean;
  author: User;
  attachments: string[];
  createdAt: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: 'bug' | 'question' | 'report' | 'appeal' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  createdBy: User;
  assignedTo?: User;
  messages?: TicketMessage[];
  _count?: { messages: number };
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

interface TicketsListResponse {
  success: boolean;
  data: Ticket[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateTicketData {
  title: string;
  description: string;
  category: 'bug' | 'question' | 'report' | 'appeal' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// User hooks
export function useMyTickets(page = 1, limit = 10, status?: string) {
  return useQuery({
    queryKey: ['tickets', 'my', page, limit, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status) params.append('status', status);
      
      const response = await api.get<TicketsListResponse>(`/tickets/my?${params}`);
      return response.data;
    },
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['tickets', 'detail', id],
    queryFn: async () => {
      const response = await api.get(`/tickets/${id}`);
      return response.data.data as Ticket;
    },
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateTicketData) => {
      const response = await api.post('/tickets', data);
      return response.data.data as Ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useAddTicketMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
      const response = await api.post(`/tickets/${ticketId}/messages`, { content });
      return response.data.data as TicketMessage;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useCloseTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const response = await api.patch(`/tickets/${ticketId}/close`);
      return response.data.data as Ticket;
    },
    onSuccess: (_, ticketId) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

// Admin hooks
export function useAllTickets(page = 1, limit = 20, filters?: { status?: string; category?: string; priority?: string }) {
  return useQuery({
    queryKey: ['admin', 'tickets', page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.priority) params.append('priority', filters.priority);
      
      const response = await api.get<TicketsListResponse>(`/tickets?${params}`);
      return response.data;
    },
  });
}

export function useAssignTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, assignedToId }: { ticketId: string; assignedToId?: string }) => {
      const response = await api.patch(`/tickets/${ticketId}/assign`, { assignedToId });
      return response.data.data as Ticket;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      const response = await api.patch(`/tickets/${ticketId}/status`, { status });
      return response.data.data as Ticket;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] });
    },
  });
}

