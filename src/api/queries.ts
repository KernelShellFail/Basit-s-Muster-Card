import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LocalDB } from '../services/db';
import type { 
  Worker, 
  Site, 
  AttendanceRecord, 
  LeaveRequest, 
  PaymentRecord, 
  Organization,
  UserProfile,
  ChatMessage,
  SystemNotification
} from '../types';

export const queryKeys = {
  workers: ['workers'] as const,
  sites: ['sites'] as const,
  attendance: ['attendance'] as const,
  leaves: ['leaves'] as const,
  payments: ['payments'] as const,
  organization: ['organization'] as const,
  users: ['users'] as const,
  chat: (siteId: string) => ['chat', siteId] as const,
  notifications: ['notifications'] as const,
  labourSubmissions: ['labourSubmissions'] as const,
};

export const useWorkers = () => {
  return useQuery({
    queryKey: queryKeys.workers,
    queryFn: () => LocalDB.getWorkers()
  });
};

export const useSites = () => {
  return useQuery({
    queryKey: queryKeys.sites,
    queryFn: () => LocalDB.getSites()
  });
};

export const useAttendance = () => {
  return useQuery({
    queryKey: queryKeys.attendance,
    queryFn: () => LocalDB.getAttendance()
  });
};

export const useLeaves = () => {
  return useQuery({
    queryKey: queryKeys.leaves,
    queryFn: () => LocalDB.getLeaves()
  });
};

export const usePayments = () => {
  return useQuery({
    queryKey: queryKeys.payments,
    queryFn: () => LocalDB.getPayments()
  });
};

export const useOrganization = () => {
  return useQuery({
    queryKey: queryKeys.organization,
    queryFn: () => LocalDB.getOrganization()
  });
};

export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => LocalDB.getUsers()
  });
};

export const useChat = (siteId: string) => {
  return useQuery({
    queryKey: queryKeys.chat(siteId),
    queryFn: () => LocalDB.getChat(siteId),
    enabled: !!siteId,
  });
};

export const useNotifications = () => {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => LocalDB.getNotifications()
  });
};

export const useLabourSubmissions = () => {
  return useQuery({
    queryKey: queryKeys.labourSubmissions,
    queryFn: () => LocalDB.getLabourSubmissions()
  });
};

// Mutations
export const useAddWorker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (worker: Worker) => LocalDB.saveWorker(worker),
    onSuccess: (_, worker) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workers });
      LocalDB.createNotification({
        title: 'Worker registered',
        message: `${worker.name} has been added to the worker roster.`,
        type: 'info',
        link: '/workers',
      }).catch(() => {});
    },
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (records: AttendanceRecord[]) => LocalDB.saveAttendanceRecords(records),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendance }),
  });
};

export const useAddPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payment: PaymentRecord) => LocalDB.savePayment(payment),
    onSuccess: (_, payment) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      LocalDB.createNotification({
        title: 'Wage payment released',
        message: `Payment of the amount was released to ${payment.workerName}.`,
        type: 'payment',
        link: '/payments',
      }).catch(() => {});
    },
  });
};

export const useAddLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leave: LeaveRequest) => LocalDB.saveLeaveRequest(leave),
    onSuccess: (_, leave) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves });
      LocalDB.createNotification({
        title: 'New leave request',
        message: `${leave.workerName} requested ${leave.leaveType} leave (${leave.startDate} to ${leave.endDate}).`,
        type: 'warning',
        link: '/leaves',
      }).catch(() => {});
    },
  });
};

export const useSendChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (msg: ChatMessage) => LocalDB.addChatMessage(msg),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: queryKeys.chat(variables.siteId) }),
  });
};

export const useDeleteWorker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LocalDB.deleteWorker(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.workers }),
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (org: Organization) => LocalDB.saveOrganization(org),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.organization }),
  });
};

export const useAddSite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (site: Site) => LocalDB.saveSite(site),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sites }),
  });
};

export const useRemoveSite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LocalDB.deleteSite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sites }),
  });
};

export const useRemovePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LocalDB.deletePayment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.payments }),
  });
};

export const useAddUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: UserProfile) => LocalDB.saveUser(user),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  });
};

export const useRemoveUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => LocalDB.deleteUser(uid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  });
};

export const useClearNotifications = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => LocalDB.markNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LocalDB.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
};

export const useAddNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notif: Parameters<typeof LocalDB.createNotification>[0]) => LocalDB.createNotification(notif),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
};
export const useSubmitLabourAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (claim: any) => LocalDB.saveLabourSubmission(claim),
    onSuccess: (_, claim) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labourSubmissions });
      LocalDB.createNotification({
        title: 'Attendance claim submitted',
        message: claim?.workerName ? `${claim.workerName} submitted a daily attendance claim.` : 'A labour attendance claim was submitted for review.',
        type: 'info',
        link: '/verification',
      }).catch(() => {});
    },
  });
};
