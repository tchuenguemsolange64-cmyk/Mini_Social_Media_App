import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import API from '../utils/api';

interface User {
    id: string;
    email: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    bio?: string;
    location?: string;
    website?: string;
    is_verified?: boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,

            login: (token, user) => {
                set({ token, user, isAuthenticated: true });
            },

            logout: () => {
                set({ token: null, user: null, isAuthenticated: false });
            },

            updateUser: (updates) => {
                const currentUser = get().user;
                if (currentUser) {
                    set({ user: { ...currentUser, ...updates } });
                }
            },

            fetchProfile: async () => {
                const token = get().token;
                if (!token) return;

                set({ isLoading: true });
                try {
                    const res = await API.get('/auth/me', token);
                    if (res.success && res.data) {
                        set({ user: res.data });
                    }
                } catch (error) {
                    console.error('Failed to fetch profile', error);
                    // Optional: logout if token invalid
                    // get().logout();
                } finally {
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
