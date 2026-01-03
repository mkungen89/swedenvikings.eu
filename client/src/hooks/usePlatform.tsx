import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';

export interface PlatformAccount {
  id: string;
  userId: string;
  platform: 'steam' | 'xbox' | 'psn';
  platformId: string;
  platformUsername?: string;
  platformAvatar?: string;
  isPrimary: boolean;
  linkedAt: string;
  updatedAt: string;
}

export function usePlatformAccounts() {
  return useQuery({
    queryKey: ['platformAccounts'],
    queryFn: async () => {
      const response = await api.get('/platform/accounts');
      return response.data as PlatformAccount[];
    },
  });
}

export function useLinkCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const response = await api.post('/platform/link-code', { code });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Spelkonto länkat!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Kunde inte länka kontot';
      toast.error(message);
    },
  });
}

export function useSetPrimaryPlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const response = await api.put(`/platform/accounts/${accountId}/primary`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformAccounts'] });
      toast.success('Primär plattform uppdaterad');
    },
    onError: () => {
      toast.error('Kunde inte uppdatera primär plattform');
    },
  });
}

export function useUnlinkPlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const response = await api.delete(`/platform/accounts/${accountId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Plattform borttagen');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Kunde inte ta bort plattformen';
      toast.error(message);
    },
  });
}

export function getPlatformIcon(platform: string): JSX.Element | null {
  const svgProps = { className: "w-5 h-5", viewBox: "0 0 24 24", fill: "currentColor" as const };

  switch (platform) {
    case 'steam':
      return (
        <svg {...svgProps}>
          <path d="M12.5 3.5l-10 5.5v7l10 5.5l10-5.5v-7l-10-5.5zm0 2.121l7.121 3.921l-7.121 3.921l-7.121-3.921l7.121-3.921zm-8 10.758v-4.758l8 4.4v4.758l-8-4.4zm10 4.4v-4.758l8-4.4v4.758l-8 4.4z"/>
        </svg>
      );
    case 'xbox':
      return (
        <svg {...svgProps}>
          <path d="M4.102 21.033A11.947 11.947 0 0012 24a11.96 11.96 0 007.902-2.967L13.846 6.12l-9.744 14.913zm7.902.967c-2.164 0-4.26-.577-6.09-1.69L13.846 6.12l7.902 11.853A11.918 11.918 0 0112 22zm7.902-4.033L12 3.88 4.196 17.967C2.447 16.278 1.333 13.906 1.333 11.333 1.333 5.595 6.261.667 12 .667S22.667 5.595 22.667 11.333c0 2.573-1.114 4.945-2.863 6.634z"/>
        </svg>
      );
    case 'psn':
      return (
        <svg {...svgProps}>
          <path d="M8.985 2.596v17.548l3.015 1.76V6.688zM0 12.724V8.008l3.015-1.76v8.236zm14.03 9.16l-3.015-1.76v-17.548l3.015 1.76zm9.97-9.16V8.008l-3.015-1.76v8.236z"/>
        </svg>
      );
    default:
      return null;
  }
}

export function getPlatformColor(platform: string) {
  switch (platform) {
    case 'steam':
      return 'bg-[#171a21] text-[#66c0f4]';
    case 'xbox':
      return 'bg-[#107C10] text-white';
    case 'psn':
      return 'bg-[#0070CC] text-white';
    default:
      return 'bg-gray-800 text-gray-300';
  }
}

export function getPlatformName(platform: string) {
  switch (platform) {
    case 'steam':
      return 'Steam (PC)';
    case 'xbox':
      return 'Xbox';
    case 'psn':
      return 'PlayStation';
    default:
      return platform;
  }
}
