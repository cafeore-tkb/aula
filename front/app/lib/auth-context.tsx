import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import {
	clearAuthSession,
	getAuthSession,
	isSessionValid,
	saveAuthSession,
} from '../lib/cookie-utils';
import {
	createUserProfile,
	getUserProfile,
	onAuthStateChange,
	type UserProfile,
} from '../lib/firebase';

interface AuthContextType {
	user: User | null;
	userProfile: UserProfile | null;
	loading: boolean;
	refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	userProfile: null,
	loading: true,
	refreshProfile: async () => {},
});

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

interface AuthProviderProps {
	children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null);
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);

	const refreshProfile = async () => {
		if (user) {
			try {
				const profile = await getUserProfile(user.uid);
				setUserProfile(profile);
			} catch (error) {
				console.error('Error fetching user profile:', error);
			}
		}
	};

	// 初期化時にCookieからセッション復元を試行
	useEffect(() => {
		const initializeAuth = async () => {
			// まずCookieからセッション情報を確認
			const sessionData = getAuthSession();

			if (sessionData && isSessionValid()) {
				// Cookieが有効な場合、Firebase Authの状態変化を待つ
				console.log(
					'Valid session found in cookie, waiting for Firebase auth state...',
				);
			} else {
				// 無効なセッションの場合はCookieをクリア
				clearAuthSession();
			}
		};

		initializeAuth();
	}, []);

	useEffect(() => {
		const unsubscribe = onAuthStateChange(async (user) => {
			setUser(user);

			if (user) {
				try {
					// ユーザーがログインした場合、Cookieにセッション情報を保存
					saveAuthSession({
						uid: user.uid,
						email: user.email,
						displayName: user.displayName,
						photoURL: user.photoURL,
					});

					// Create or update user profile in Firestore
					await createUserProfile(user);
					// Get the latest profile data
					const profile = await getUserProfile(user.uid);
					setUserProfile(profile);
				} catch (error) {
					console.error('Error handling user profile:', error);
				}
			} else {
				// ユーザーがログアウトした場合、Cookieをクリア
				clearAuthSession();
				setUserProfile(null);
			}

			setLoading(false);
		});

		return unsubscribe;
	}, []);

	const value = {
		user,
		userProfile,
		loading,
		refreshProfile,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
