// Mock implementation of the admin dashboard hook
export default function useAdminDashboard() {
  return {
    loading: false,
    error: null,
    stats: { users: 1, props: 2 }
  };
}
