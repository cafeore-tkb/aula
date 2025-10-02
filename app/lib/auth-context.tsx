import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import {
	clearAuthSession,
	getAuthSession,
	isSessionValid,
	saveAuthSession,
} from '../lib/cookie-utils';
import {
	getUserProfile,
	onAuthStateChange,
	type UserProfile,
} from '../lib/firebase';

interface AuthContextType {
	user: User | null;
	userProfile: UserProfile | null;
	loading: boolean;
	refreshProfile: () => Promise<void>;
	// セッション期限切れなどで再ログインが必要になったか
	sessionExpired: boolean;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	userProfile: null,
	loading: true,
	refreshProfile: async () => {},
	sessionExpired: false,
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
	const [sessionExpired, setSessionExpired] = useState(false);

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
				// 無効なセッションの場合はCookieをクリアし、セッション期限切れフラグを立てる
				if (sessionData) {
					setSessionExpired(true);
				}
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
					// ログイン成功時に期限切れフラグをリセット
					setSessionExpired(false);
					// ユーザーがログインした場合、Cookieにセッション情報を保存
					saveAuthSession({
						uid: user.uid,
						email: user.email,
						displayName: user.displayName,
						photoURL: user.photoURL,
					});

					// ユーザープロファイルを取得（存在しない場合は後で処理）
					const profile = await getUserProfile(user.uid);
					setUserProfile(profile);
				} catch (error) {
					console.error('Error handling user profile:', error);
					// プロファイルが見つからない場合はnullのままにする
					setUserProfile(null);
				}
			} else {
				// ユーザーがログアウトまたはセッション期限切れ場合
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
		sessionExpired,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
