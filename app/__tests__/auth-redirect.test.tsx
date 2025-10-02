/**
 * 認証リダイレクト挙動の単体テスト
 *
 * このテストでは以下を検証する:
 * 1. 未ログイン状態で保護ページ (/dashboard) にアクセスした場合 /login にリダイレクトされる
 * 2. 未ログイン状態で /login に直接アクセスした場合 そのまま表示される
 *
 * Firebase 側の onAuthStateChange はモックし、常に「未ログイン (null)」を返すことで
 * 認証フレームワークに依存しない純粋なルーティング挙動のみを確認する。
 */
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AuthProvider } from '../lib/auth-context';
import Dashboard from '../pages/dashboard';
import { Home } from '../pages/home';
import Login from '../pages/login';

// --- Firebase モジュールのモック -----------------------------------------
// AuthProvider 内部で利用される Firebase 関連 API を最小限モック化する。
// ここでは "常に未認証" な状態を再現したいので onAuthStateChange のコールバックに null を渡す。
vi.mock('../lib/firebase', () => {
	return {
		onAuthStateChange: (cb: (user: unknown) => void) => {
			cb(null);
			return () => {};
		},
		createUserProfile: vi.fn(),
		getUserProfile: vi.fn(),
	};
});

// AuthContext 内のデバッグログを抑制（テスト出力ノイズ低減）
vi.spyOn(console, 'log').mockImplementation(() => {});

function setup(initialPath: string) {
	// 初期 URL (initialEntries) を指定してメモリ上のルーターを構築
	// 実際のアプリ構成に近い最小限のルートのみを用意
	return render(
		<AuthProvider>
			<MemoryRouter initialEntries={[initialPath]}>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/login" element={<Login />} />
					<Route path="/dashboard" element={<Dashboard />} />
				</Routes>
			</MemoryRouter>
		</AuthProvider>,
	);
}

describe('Auth redirect behavior', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('未認証で /dashboard にアクセスすると /login が表示される', async () => {
		const utils = setup('/dashboard');
		// LoginPage の見出しテキスト出現をもってリダイレクト完了とみなす
		const loginHeading = await utils.findByText('ログインが必要です');
		expect(loginHeading).toBeInTheDocument();
	});

	it('/login へ未認証でアクセスした場合そのまま表示される', async () => {
		const utils = setup('/login');
		const loginHeading = await utils.findByText('ログインが必要です');
		expect(loginHeading).toBeInTheDocument();
	});
});
