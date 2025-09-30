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

// User profile interface
export interface UserProfile {
	uid: string;
	email: string;
	displayName: string;
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
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const logOut = async () => {
	// Firebase からログアウト
	await signOut(auth);
	// Cookieからセッション情報を削除
	clearAuthSession();
};

export const onAuthStateChange = (callback: (user: User | null) => void) =>
	onAuthStateChanged(auth, callback);

// Firestore functions
export const createUserProfile = async (user: User): Promise<void> => {
	if (!user.email) return;

	const userDocRef = doc(db, 'users', user.uid);
	const userDoc = await getDoc(userDocRef);

	if (!userDoc.exists()) {
		// Create new user profile
		const userData: Omit<UserProfile, 'uid'> = {
			email: user.email,
			displayName: user.displayName || '',
			photoURL: user.photoURL || '',
			createdAt: serverTimestamp() as Timestamp,
			updatedAt: serverTimestamp() as Timestamp,
			lastLoginAt: serverTimestamp() as Timestamp,
		};

		await setDoc(userDocRef, userData);
	} else {
		// Update last login time
		await updateDoc(userDocRef, {
			lastLoginAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		});
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
