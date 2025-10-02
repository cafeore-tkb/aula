import { initializeApp } from 'firebase/app';
import {
	GoogleAuthProvider,
	getAuth,
	onAuthStateChanged,
	signInWithPopup,
	signOut,
	type User,
} from 'firebase/auth';
import {
	doc,
	getDoc,
	getFirestore,
	serverTimestamp,
	setDoc,
	type Timestamp,
	updateDoc,
} from 'firebase/firestore';
import { clearAuthSession } from './cookie-utils';

// User profile interface - 更新されたデータスキーマに対応
export interface UserProfile {
	uid: string;
	gmail: string; // Gmail アドレス
	name: string; // ユーザー名
	isAdmin: boolean; // 管理者権限フラグ（admin → isAdmin）
	isExaminer: boolean; // 試験官権限フラグ（examiner → isExaminer）
	isGraduated: boolean; // 卒業済みフラグ（新規追加）
	year: number; // 年度情報
	photoURL?: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
	lastLoginAt: Timestamp;
}

// Firebase configuration
const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'your-api-key',
	authDomain:
		import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'your-project-id',
	storageBucket:
		import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
	messagingSenderId:
		import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
	appId: import.meta.env.VITE_FIREBASE_APP_ID || 'your-app-id',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Authentication functions
/**
 * Googleアカウントでログインする関数（既存ユーザー専用）
 */
export const signInWithGoogle = async () => {
	console.log('Google Sign In 開始...');
	const result = await signInWithPopup(auth, googleProvider);
	
	console.log('Google認証完了:', result.user?.email);
	console.log('認証後のAuth State:', auth.currentUser ? 'Authenticated' : 'Not Authenticated');
	
	// Firebase認証が完了するまで少し待つ
	await new Promise(resolve => setTimeout(resolve, 100));
	
	// ユーザーが存在しない場合はエラー
	if (result.user) {
		try {
			const exists = await checkUserExists(result.user.uid);
			if (!exists) {
				console.log('ユーザーが存在しません。ログアウトします。');
				// ログアウト処理
				await auth.signOut();
				throw new Error('このユーザーは登録されていません。新規登録を行ってください。');
			}
		} catch (error) {
			console.error('User existence check error:', error);
			await auth.signOut();
			throw error;
		}
	}
	
	return result;
};

/**
 * 新規ユーザー登録用のGoogle認証関数
 */
export const registerWithGoogle = async () => {
	console.log('Google Register 開始...');
	const result = await signInWithPopup(auth, googleProvider);
	
	console.log('Google認証完了:', result.user?.email);
	console.log('認証後のAuth State:', auth.currentUser ? 'Authenticated' : 'Not Authenticated');
	
	// Firebase認証が完了するまで少し待つ
	await new Promise(resolve => setTimeout(resolve, 100));
	
	// ユーザーが既に存在する場合はエラー
	if (result.user) {
		try {
			const exists = await checkUserExists(result.user.uid);
			if (exists) {
				console.log('ユーザーが既に存在します。ログアウトします。');
				// ログアウト処理
				await auth.signOut();
				throw new Error('このユーザーは既に登録されています。ログインを行ってください。');
			}
		} catch (error) {
			console.error('User existence check error:', error);
			// 存在チェックでエラーが出た場合、新規登録として続行
			console.log('存在チェックエラーのため新規登録として続行');
		}
	}
	
	return result;
};

export const logOut = async () => {
	// Firebase からログアウト
	await signOut(auth);
	// Cookieからセッション情報を削除
	clearAuthSession();
};

export const onAuthStateChange = (callback: (user: User | null) => void) =>
	onAuthStateChanged(auth, callback);

// Firestore functions
/**
 * ユーザーがFirestoreに存在するかチェックする関数
 */
export const checkUserExists = async (uid: string): Promise<boolean> => {
	console.log('ユーザー存在チェック:', uid);
	console.log('Current Auth State:', auth.currentUser ? 'Authenticated' : 'Not Authenticated');
	
	try {
		const userDocRef = doc(db, 'users', uid);
		const userDoc = await getDoc(userDocRef);
		const exists = userDoc.exists();
		
		console.log('ユーザー存在結果:', exists);
		return exists;
	} catch (error) {
		console.error('checkUserExists error:', error);
		throw error;
	}
};

/**
 * 新規ユーザー登録専用関数
 * Firestoreのusersコレクションに新規ユーザーを追加
 * 
 * Firestoreの構造:
 * users (コレクション)
 *   └── {user.uid} (ドキュメントID)
 *       ├── gmail: string
 *       ├── name: string  
 *       ├── isAdmin: boolean
 *       ├── isExaminer: boolean
 *       ├── isGraduated: boolean
 *       ├── year: number
 *       ├── photoURL?: string
 *       ├── createdAt: Timestamp
 *       ├── updatedAt: Timestamp
 *       └── lastLoginAt: Timestamp
 */
export const registerNewUser = async (user: User): Promise<void> => {
	if (!user.email) {
		throw new Error('ユーザーのメールアドレスが取得できませんでした');
	}

	console.log(`新規ユーザー登録中: ${user.email} (UID: ${user.uid})`);
	console.log('Firebase Auth State:', auth.currentUser ? 'Authenticated' : 'Not Authenticated');
	console.log('User UID:', user.uid);

	// users コレクション内にユーザーのUID をドキュメントIDとして使用
	const userDocRef = doc(db, 'users', user.uid);
	
	try {
		const userDoc = await getDoc(userDocRef);

		if (userDoc.exists()) {
			throw new Error('このユーザーは既に登録されています');
		}
	} catch (error) {
		console.error('Error checking user existence:', error);
		// 既存チェックでエラーが出た場合、新規登録処理を続行
	}
	
	// 新規ユーザープロファイル作成
	const userData: Omit<UserProfile, 'uid'> = {
		gmail: user.email,
		name: user.displayName || user.email?.split('@')[0] || 'Unknown User',
		isAdmin: false, // デフォルトは一般ユーザー
		isExaminer: false, // デフォルトは試験官権限なし
		isGraduated: false, // デフォルトは在学中
		year: new Date().getFullYear(), // 現在年度をデフォルトに設定
		photoURL: user.photoURL || '',
		createdAt: serverTimestamp() as Timestamp,
		updatedAt: serverTimestamp() as Timestamp,
		lastLoginAt: serverTimestamp() as Timestamp,
	};

	try {
		// Firestoreの users コレクションにドキュメントとして保存
		await setDoc(userDocRef, userData);
		console.log(`新規ユーザー登録完了: ${user.email}`);
	} catch (error) {
		console.error('Firestore write error:', error);
		throw new Error(`Firestoreへの書き込みに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
};

/**
 * 既存ユーザーのログイン処理専用関数
 * 最終ログイン時刻のみ更新
 */
export const loginExistingUser = async (user: User): Promise<void> => {
	if (!user.email) {
		throw new Error('ユーザーのメールアドレスが取得できませんでした');
	}

	console.log(`既存ユーザーログイン: ${user.email} (UID: ${user.uid})`);
	console.log('Firebase Auth State:', auth.currentUser ? 'Authenticated' : 'Not Authenticated');
	console.log('User UID:', user.uid);

	const userDocRef = doc(db, 'users', user.uid);
	
	try {
		const userDoc = await getDoc(userDocRef);

		if (!userDoc.exists()) {
			throw new Error('このユーザーは登録されていません。新規登録を行ってください。');
		}

		// 既存ユーザーの最終ログイン時刻のみ更新
		await updateDoc(userDocRef, {
			lastLoginAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		});
		
		console.log(`ログイン時刻更新完了: ${user.email}`);
	} catch (error) {
		console.error('Firestore operation error:', error);
		throw new Error(`Firestoreの操作に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
};

/**
 * 新規登録とログインを統合した従来の関数（後方互換性のため残す）
 * @deprecated 新しいコードでは registerNewUser または loginExistingUser を使用してください
 */
export const createUserProfile = async (user: User): Promise<void> => {
	if (!user.email) return;

	const userExists = await checkUserExists(user.uid);
	
	if (!userExists) {
		await registerNewUser(user);
	} else {
		await loginExistingUser(user);
	}
};

export const getUserProfile = async (
	uid: string,
): Promise<UserProfile | null> => {
	const userDocRef = doc(db, 'users', uid);
	const userDoc = await getDoc(userDocRef);

	if (userDoc.exists()) {
		return { uid, ...userDoc.data() } as UserProfile;
	}
	return null;
};

export const updateUserProfile = async (
	uid: string,
	updates: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>,
): Promise<void> => {
	const userDocRef = doc(db, 'users', uid);
	await updateDoc(userDocRef, {
		...updates,
		updatedAt: serverTimestamp(),
	});
};
