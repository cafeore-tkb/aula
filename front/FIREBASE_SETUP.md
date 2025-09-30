# Firebase Authentication + Firestore セットアップガイド

このプロジェクトにFirebase AuthenticationとFirestore Databaseが統合されました。以下の手順に従ってセットアップしてください。

## 🚀 セットアップ手順

### 1. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクト名を入力して作成

### 2. Firebase Authentication の設定

1. Firebase Console で「Authentication」を選択
2. 「始める」をクリック
3. 「Sign-in method」タブで「Google」を有効化
4. プロジェクトのサポートメールを設定

### 3. Firestore Database の設定

1. Firebase Console で「Firestore Database」を選択
2. 「データベースの作成」をクリック
3. **「テストモードで開始」**を選択（後でセキュリティルールを設定）
4. ロケーションを選択（アジア太平洋地域の場合は `asia-northeast1` を推奨）

### 4. Firestore セキュリティルールの設定

1. Firestore Console で「ルール」タブを選択
2. 以下のルールを設定（`firestore.rules`ファイルを参照）：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーは自分のドキュメントのみ読み書き可能
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Firebase設定の取得

1. Firebase Console で「プロジェクトの設定」（歯車アイコン）をクリック
2. 「全般」タブで「アプリを追加」→「ウェブ」を選択
3. アプリ名を入力してアプリを登録
4. Firebase SDK設定をコピー

### 6. 環境変数の設定

1. `.env.example`をコピーして`.env`ファイルを作成：
   ```bash
   cp .env.example .env
   ```

2. `.env`ファイルにFirebase設定を追加：
   ```env
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your-app-id
   ```

### 7. 開発サーバーの起動

```bash
npm run dev
```

## 📁 追加されたファイル構造

```
app/
├── lib/
│   ├── firebase.ts          # Firebase設定と認証・Firestore関数
│   └── auth-context.tsx     # 認証状態管理Context (Firestore連携)
├── components/
│   ├── login-page.tsx       # ログインページ
│   ├── user-profile.tsx     # ユーザープロフィール (Firestore データ表示)
│   ├── edit-profile.tsx     # プロフィール編集
│   └── protected-route.tsx  # 認証が必要なルートのラッパー
└── routes/
    └── dashboard.tsx        # 認証が必要なダッシュボードページ
```

## 🔐 認証・データ管理フロー

1. **未認証状態**: ログインページが表示
2. **Googleサインイン**: Googleアカウントでログイン
3. **Firestore保存**: ユーザー情報をFirestoreに自動保存/更新
4. **認証完了**: ユーザー情報が表示され、保護されたページにアクセス可能
5. **プロフィール編集**: Firestoreのユーザーデータを更新
6. **ログアウト**: 認証状態をクリアしてログインページに戻る

## 🎯 主要な機能

- ✅ Googleアカウントでのサインイン
- ✅ 認証状態の自動管理
- ✅ 保護されたルート
- ✅ **Firestoreへのユーザーデータ保存**
- ✅ **ユーザープロフィールの表示・編集**
- ✅ **作成日・最終ログイン日・更新日の記録**
- ✅ ログアウト機能
- ✅ ローディング状態の管理
- ✅ エラーハンドリング

## 💾 Firestore データ構造

### Users コレクション (`/users/{uid}`)

```typescript
{
  uid: string;           // ユーザーID
  email: string;         // メールアドレス
  displayName: string;   // 表示名
  photoURL?: string;     // プロフィール画像URL
  createdAt: Timestamp;  // アカウント作成日
  updatedAt: Timestamp;  // 最終更新日
  lastLoginAt: Timestamp; // 最終ログイン日
}
```

## 🔧 カスタマイズ

### 他の認証プロバイダーを追加する場合

`app/lib/firebase.ts`でプロバイダーを追加：

```typescript
import { FacebookAuthProvider, TwitterAuthProvider } from 'firebase/auth';

const facebookProvider = new FacebookAuthProvider();
const twitterProvider = new TwitterAuthProvider();

export const signInWithFacebook = () => signInWithPopup(auth, facebookProvider);
export const signInWithTwitter = () => signInWithPopup(auth, twitterProvider);
```

### 追加のユーザー情報を取得する場合

`auth-context.tsx`で状態を拡張：

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: UserProfile | null; // カスタムユーザープロフィール
}
```

## 🚨 重要な注意事項

1. **環境変数**: `.env`ファイルをGitにコミットしないでください
2. **Firebase Rules**: 上記のFirestoreセキュリティルールを必ず設定してください
3. **ドメイン設定**: Firebase Consoleで承認済みドメインを設定してください
4. **データ保護**: ユーザーは自分のデータのみアクセス可能になっています

## � Firestoreデータ管理

### 自動で実行される処理
- 初回ログイン時: ユーザープロフィール作成
- 再ログイン時: `lastLoginAt` の更新
- プロフィール編集時: `updatedAt` の更新

### 手動で実行可能な処理
- `createUserProfile()`: ユーザープロフィール作成
- `getUserProfile()`: ユーザープロフィール取得
- `updateUserProfile()`: ユーザープロフィール更新

## �📖 参考リンク

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [React Router Documentation](https://reactrouter.com/)
- [Firebase Console](https://console.firebase.google.com/)