import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, useLocation, Navigate, Outlet, Meta, Links, ScrollRestoration, Scripts } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import * as React from "react";
import React__default, { createContext, useState, useEffect, useContext, useId } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signOut, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    let timeoutId = setTimeout(
      () => abort(),
      streamTimeout + 1e3
    );
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = void 0;
              callback();
            }
          });
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          pipe(body);
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
function setCookie(name, value, options = {}) {
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  if (options.expires) {
    cookieString += `; expires=${options.expires.toUTCString()}`;
  }
  if (options.maxAge) {
    cookieString += `; max-age=${options.maxAge}`;
  }
  if (options.path) {
    cookieString += `; path=${options.path}`;
  }
  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }
  if (options.secure) {
    cookieString += "; secure";
  }
  if (options.httpOnly) {
    cookieString += "; httponly";
  }
  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }
  document.cookie = cookieString;
}
function getCookie(name) {
  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  return null;
}
function deleteCookie(name, path = "/") {
  setCookie(name, "", {
    expires: /* @__PURE__ */ new Date(0),
    path
  });
}
function saveAuthSession(user) {
  const sessionData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    timestamp: Date.now()
  };
  const thirtyMinutes = 30 * 60;
  setCookie("auth_session", JSON.stringify(sessionData), {
    maxAge: thirtyMinutes,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
}
function getAuthSession() {
  const sessionCookie = getCookie("auth_session");
  if (!sessionCookie) {
    return null;
  }
  try {
    const sessionData = JSON.parse(sessionCookie);
    const thirtyMinutes = 30 * 60 * 1e3;
    const now = Date.now();
    if (now - sessionData.timestamp > thirtyMinutes) {
      deleteCookie("auth_session");
      return null;
    }
    return sessionData;
  } catch (error) {
    console.error("Auth session cookie parsing error:", error);
    deleteCookie("auth_session");
    return null;
  }
}
function clearAuthSession() {
  deleteCookie("auth_session");
}
function isSessionValid() {
  return getAuthSession() !== null;
}
const firebaseConfig = {
  apiKey: "AIzaSyBu0YKmUUTIh5GWNAxXbj7kBBkhUMPWgOQ",
  authDomain: "aula-eb466.firebaseapp.com",
  projectId: "aula-eb466",
  storageBucket: "aula-eb466.appspot.com",
  messagingSenderId: "559852586233",
  appId: "fff95722d51415c55bce28"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const signInWithGoogle = async () => {
  console.log("Google Sign In 開始...");
  const result = await signInWithPopup(auth, googleProvider);
  console.log("Google認証完了:", result.user?.email);
  console.log("認証後のAuth State:", auth.currentUser ? "Authenticated" : "Not Authenticated");
  await new Promise((resolve) => setTimeout(resolve, 100));
  if (result.user) {
    try {
      const exists = await checkUserExists(result.user.uid);
      if (!exists) {
        console.log("ユーザーが存在しません。ログアウトします。");
        await auth.signOut();
        throw new Error("このユーザーは登録されていません。新規登録を行ってください。");
      }
    } catch (error) {
      console.error("User existence check error:", error);
      await auth.signOut();
      throw error;
    }
  }
  return result;
};
const registerWithGoogle = async () => {
  console.log("Google Register 開始...");
  const result = await signInWithPopup(auth, googleProvider);
  console.log("Google認証完了:", result.user?.email);
  console.log("認証後のAuth State:", auth.currentUser ? "Authenticated" : "Not Authenticated");
  await new Promise((resolve) => setTimeout(resolve, 100));
  if (result.user) {
    try {
      const exists = await checkUserExists(result.user.uid);
      if (exists) {
        console.log("ユーザーが既に存在します。ログアウトします。");
        await auth.signOut();
        throw new Error("このユーザーは既に登録されています。ログインを行ってください。");
      }
    } catch (error) {
      console.error("User existence check error:", error);
      console.log("存在チェックエラーのため新規登録として続行");
    }
  }
  return result;
};
const logOut = async () => {
  await signOut(auth);
  clearAuthSession();
};
const onAuthStateChange = (callback) => onAuthStateChanged(auth, callback);
const checkUserExists = async (uid) => {
  console.log("ユーザー存在チェック:", uid);
  console.log("Current Auth State:", auth.currentUser ? "Authenticated" : "Not Authenticated");
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    const exists = userDoc.exists();
    console.log("ユーザー存在結果:", exists);
    return exists;
  } catch (error) {
    console.error("checkUserExists error:", error);
    throw error;
  }
};
const registerNewUser = async (user) => {
  if (!user.email) {
    throw new Error("ユーザーのメールアドレスが取得できませんでした");
  }
  console.log(`新規ユーザー登録中: ${user.email} (UID: ${user.uid})`);
  console.log("Firebase Auth State:", auth.currentUser ? "Authenticated" : "Not Authenticated");
  console.log("User UID:", user.uid);
  const userDocRef = doc(db, "users", user.uid);
  try {
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      throw new Error("このユーザーは既に登録されています");
    }
  } catch (error) {
    console.error("Error checking user existence:", error);
  }
  const userData = {
    gmail: user.email,
    name: user.displayName || user.email?.split("@")[0] || "Unknown User",
    isAdmin: false,
    // デフォルトは一般ユーザー
    isExaminer: false,
    // デフォルトは試験官権限なし
    isGraduated: false,
    // デフォルトは在学中
    year: (/* @__PURE__ */ new Date()).getFullYear(),
    // 現在年度をデフォルトに設定
    photoURL: user.photoURL || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp()
  };
  try {
    await setDoc(userDocRef, userData);
    console.log(`新規ユーザー登録完了: ${user.email}`);
  } catch (error) {
    console.error("Firestore write error:", error);
    throw new Error(`Firestoreへの書き込みに失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};
const loginExistingUser = async (user) => {
  if (!user.email) {
    throw new Error("ユーザーのメールアドレスが取得できませんでした");
  }
  console.log(`既存ユーザーログイン: ${user.email} (UID: ${user.uid})`);
  console.log("Firebase Auth State:", auth.currentUser ? "Authenticated" : "Not Authenticated");
  console.log("User UID:", user.uid);
  const userDocRef = doc(db, "users", user.uid);
  try {
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      throw new Error("このユーザーは登録されていません。新規登録を行ってください。");
    }
    await updateDoc(userDocRef, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`ログイン時刻更新完了: ${user.email}`);
  } catch (error) {
    console.error("Firestore operation error:", error);
    throw new Error(`Firestoreの操作に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};
const getUserProfile = async (uid) => {
  const userDocRef = doc(db, "users", uid);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    return { uid, ...userDoc.data() };
  }
  return null;
};
const updateUserProfile = async (uid, updates) => {
  const userDocRef = doc(db, "users", uid);
  await updateDoc(userDocRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};
const AuthContext = createContext({
  user: null,
  userProfile: null,
  loading: true,
  refreshProfile: async () => {
  },
  sessionExpired: false
});
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === void 0) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const refreshProfile = async () => {
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
  };
  useEffect(() => {
    const initializeAuth = async () => {
      const sessionData = getAuthSession();
      if (sessionData && isSessionValid()) {
        console.log(
          "Valid session found in cookie, waiting for Firebase auth state..."
        );
      } else {
        if (sessionData) {
          setSessionExpired(true);
        }
        clearAuthSession();
      }
    };
    initializeAuth();
  }, []);
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user2) => {
      setUser(user2);
      if (user2) {
        try {
          setSessionExpired(false);
          saveAuthSession({
            uid: user2.uid,
            email: user2.email,
            displayName: user2.displayName,
            photoURL: user2.photoURL
          });
          const profile = await getUserProfile(user2.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error handling user profile:", error);
          setUserProfile(null);
        }
      } else {
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
    sessionExpired
  };
  return /* @__PURE__ */ jsx(AuthContext.Provider, { value, children });
}
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}];
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
function AppGuard() {
  const {
    user,
    loading,
    sessionExpired
  } = useAuth();
  const location = useLocation();
  if (loading) {
    return /* @__PURE__ */ jsx("div", {
      className: "flex min-h-screen items-center justify-center",
      children: /* @__PURE__ */ jsxs("div", {
        className: "text-center",
        children: [/* @__PURE__ */ jsx("div", {
          className: "mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-gray-600",
          children: "読み込み中..."
        })]
      })
    });
  }
  if (!user && location.pathname !== "/login") {
    return /* @__PURE__ */ jsx(Navigate, {
      to: "/login",
      replace: true,
      state: {
        from: location,
        reason: sessionExpired ? "expired" : "unauthenticated"
      }
    });
  }
  return /* @__PURE__ */ jsx(Outlet, {});
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsx(AuthProvider, {
    children: /* @__PURE__ */ jsx(AppGuard, {})
  });
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "container mx-auto p-4 pt-16",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
function useSessionTimeRemaining() {
  const [timeRemaining, setTimeRemaining] = useState(null);
  useEffect(() => {
    const updateTimeRemaining = () => {
      const sessionData = getAuthSession();
      if (!sessionData) {
        setTimeRemaining(null);
        return;
      }
      const threeHours = 3 * 60 * 60 * 1e3;
      const elapsed = Date.now() - sessionData.timestamp;
      const remaining = threeHours - elapsed;
      if (remaining <= 0) {
        setTimeRemaining(null);
      } else {
        setTimeRemaining(remaining);
      }
    };
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60 * 1e3);
    return () => clearInterval(interval);
  }, []);
  const formatTimeRemaining = () => {
    if (!timeRemaining) return null;
    const hours = Math.floor(timeRemaining / (60 * 60 * 1e3));
    const minutes = Math.floor(timeRemaining % (60 * 60 * 1e3) / (60 * 1e3));
    const seconds = Math.floor(timeRemaining % (60 * 1e3) / 1e3);
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };
  return {
    timeRemaining,
    timeRemainingMs: timeRemaining,
    timeRemainingFormatted: formatTimeRemaining()
  };
}
function SessionStatus() {
  const { timeRemainingFormatted, timeRemainingMs } = useSessionTimeRemaining();
  if (!timeRemainingMs) {
    return null;
  }
  const isWarning = timeRemainingMs < 30 * 60 * 1e3;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `rounded-full px-3 py-1 text-sm ${isWarning ? "border border-yellow-300 bg-yellow-100 text-yellow-800" : "border border-blue-300 bg-blue-100 text-blue-800"}`,
      children: [
        "セッション残り時間: ",
        timeRemainingFormatted,
        isWarning && /* @__PURE__ */ jsx("span", { className: "ml-2 font-semibold text-xs", children: "⚠️ まもなく期限切れ" })
      ]
    }
  );
}
function UserProfile({ user, userProfile }) {
  const [loading, setLoading] = useState(false);
  const handleLogout = async () => {
    try {
      setLoading(true);
      await logOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "不明";
    return timestamp.toDate().toLocaleString("ja-JP");
  };
  return /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow-md", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsx(SessionStatus, {}) }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center space-x-4", children: [
      user.photoURL && /* @__PURE__ */ jsx(
        "img",
        {
          src: user.photoURL,
          alt: user.displayName || "ユーザー",
          className: "h-16 w-16 rounded-full"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900 text-xl", children: user.displayName || "ユーザー" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-sm", children: user.email })
      ] })
    ] }),
    userProfile && /* @__PURE__ */ jsxs("div", { className: "mb-6 space-y-3", children: [
      /* @__PURE__ */ jsx("h4", { className: "border-b pb-1 font-medium text-gray-700 text-sm", children: "アカウント情報" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-gray-600 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: "Gmail:" }),
          /* @__PURE__ */ jsx("span", { children: userProfile.gmail })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: "名前:" }),
          /* @__PURE__ */ jsx("span", { children: userProfile.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: "年度:" }),
          /* @__PURE__ */ jsx("span", { children: userProfile.year })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: "管理者:" }),
          /* @__PURE__ */ jsx(
            "span",
            {
              className: userProfile.isAdmin ? "font-medium text-green-600" : "text-gray-500",
              children: userProfile.isAdmin ? "✓" : "✗"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: "試験官:" }),
          /* @__PURE__ */ jsx(
            "span",
            {
              className: userProfile.isExaminer ? "font-medium text-green-600" : "text-gray-500",
              children: userProfile.isExaminer ? "✓" : "✗"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: "卒業済み:" }),
          /* @__PURE__ */ jsx(
            "span",
            {
              className: userProfile.isGraduated ? "font-medium text-green-600" : "text-gray-500",
              children: userProfile.isGraduated ? "✓" : "✗"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: "作成日:" }),
          /* @__PURE__ */ jsx("span", { children: formatDate(userProfile.createdAt) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: "最終ログイン:" }),
          /* @__PURE__ */ jsx("span", { children: formatDate(userProfile.lastLoginAt) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { children: "更新日:" }),
          /* @__PURE__ */ jsx("span", { children: formatDate(userProfile.updatedAt) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: handleLogout,
        disabled: loading,
        className: "w-full rounded-md bg-red-600 px-4 py-2 font-medium text-sm text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50",
        children: loading ? "ログアウト中..." : "ログアウト"
      }
    )
  ] });
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const Card = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    ),
    ...props
  }
));
Card.displayName = "Card";
const CardHeader = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("p-6 pt-0", className), ...props }));
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("flex items-center p-6 pt-0", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";
function Adjustment() {
  const day = ["月", "火", "水", "木", "金", "土", "日"];
  const periods = ["1", "2", "3", "4", "5", "6", "7", "8"];
  const startTimes = ["8:40", "10:10", "12:15", "13:45", "15:15", "18:00", "18:15", "19:45"];
  const endTimes = ["9:55", "11:25", "13:30", "15:00", "16:45", "18:00", "19:30", "21:00"];
  const { user, userProfile } = useAuth();
  return /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
    user && /* @__PURE__ */ jsx("div", { className: "mb-8", children: /* @__PURE__ */ jsx(UserProfile, { user, userProfile }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "mb-4 font-bold text-2xl", children: "時間割表" }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("div", { className: "grid min-w-[800px] grid-cols-8 gap-0 border border-gray-200", children: [
        /* @__PURE__ */ jsx(Card, { className: "border-0 border-b border-r border-gray-200 bg-gray-100 rounded-none", children: /* @__PURE__ */ jsx(CardContent, { className: "p-4 text-center font-medium", children: "時限" }) }),
        day.map((dayName, index) => /* @__PURE__ */ jsx(Card, { className: `border-0 border-b border-gray-200 bg-gray-100 rounded-none ${index < day.length - 1 ? "border-r" : ""}`, children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 text-center font-medium", children: [
          dayName,
          "曜日"
        ] }) }, dayName)),
        periods.map((period, periodIndex) => /* @__PURE__ */ jsxs(React__default.Fragment, { children: [
          /* @__PURE__ */ jsx(Card, { className: "border-0 border-r border-gray-200 bg-gray-50 rounded-none", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 text-center font-medium", children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-1", children: [
              period,
              "限"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-600", children: [
              startTimes[periodIndex],
              "-",
              endTimes[periodIndex]
            ] })
          ] }) }),
          day.map((dayName, dayIndex) => /* @__PURE__ */ jsx(Card, { className: `border-0 cursor-pointer rounded-none hover:bg-gray-50 ${dayIndex < day.length - 1 ? "border-r border-gray-200" : ""}`, children: /* @__PURE__ */ jsx(CardContent, { className: "flex h-16 items-center justify-center p-4" }) }, `${period}-${dayName}`))
        ] }, period))
      ] }) })
    ] })
  ] });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Adjustment
}, Symbol.toStringTag, { value: "Module" }));
function EditProfile() {
  const { user, userProfile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(userProfile?.name || "");
  const [year, setYear] = useState(
    userProfile?.year || (/* @__PURE__ */ new Date()).getFullYear()
  );
  const nameId = useId();
  const yearId = useId();
  const handleSave = async () => {
    if (!user || !name.trim()) return;
    try {
      setLoading(true);
      await updateUserProfile(user.uid, {
        name: name.trim(),
        year
      });
      await refreshProfile();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("プロフィールの更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };
  const handleCancel = () => {
    setName(userProfile?.name || "");
    setYear(userProfile?.year || (/* @__PURE__ */ new Date()).getFullYear());
    setIsEditing(false);
  };
  if (!user || !userProfile) return null;
  return /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow-md", children: [
    /* @__PURE__ */ jsx("h3", { className: "mb-4 font-semibold text-gray-900 text-lg", children: "プロフィール編集" }),
    isEditing ? /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          "label",
          {
            htmlFor: nameId,
            className: "mb-1 block font-medium text-gray-700 text-sm",
            children: "名前"
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            id: nameId,
            value: name,
            onChange: (e) => setName(e.target.value),
            className: "w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
            placeholder: "名前を入力"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          "label",
          {
            htmlFor: yearId,
            className: "mb-1 block font-medium text-gray-700 text-sm",
            children: "年度"
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "number",
            id: yearId,
            value: year,
            onChange: (e) => setYear(Number(e.target.value)),
            className: "w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
            min: "2000",
            max: "2050"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex space-x-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleSave,
            disabled: loading || !name.trim(),
            className: "rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
            children: loading ? "保存中..." : "保存"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleCancel,
            disabled: loading,
            className: "rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50",
            children: "キャンセル"
          }
        )
      ] })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-700 text-sm", children: "名前" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-900", children: userProfile.name || "未設定" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-700 text-sm", children: "Gmail" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-900", children: userProfile.gmail })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-700 text-sm", children: "年度" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-900", children: userProfile.year })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setIsEditing(true),
          className: "rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
          children: "編集"
        }
      )
    ] })
  ] });
}
function ProtectedRoute({ children }) {
  return /* @__PURE__ */ jsx(Fragment, { children });
}
function meta$2() {
  return [
    { title: "ダッシュボード - React Router App" },
    { name: "description", content: "ユーザーダッシュボード" }
  ];
}
function Dashboard() {
  const { user, userProfile } = useAuth();
  return /* @__PURE__ */ jsx(ProtectedRoute, { children: /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gray-100 py-8", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4", children: [
    /* @__PURE__ */ jsx("h1", { className: "mb-8 font-bold text-3xl text-gray-900", children: "ダッシュボード" }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-6 md:grid-cols-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-6 md:col-span-1", children: [
        user && /* @__PURE__ */ jsx(UserProfile, { user, userProfile }),
        /* @__PURE__ */ jsx(EditProfile, {})
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6 md:col-span-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow-md", children: [
          /* @__PURE__ */ jsxs("h2", { className: "mb-4 font-semibold text-gray-900 text-xl", children: [
            "ようこそ、",
            userProfile?.name || user?.displayName || "ユーザー",
            "さん！"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Firebase AuthenticationとFirestore Databaseを使用した認証・データ管理システムが正常に動作しています。" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow-md", children: [
          /* @__PURE__ */ jsx("h3", { className: "mb-3 font-semibold text-gray-900 text-lg", children: "機能" }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-gray-600", children: [
            /* @__PURE__ */ jsx("li", { children: "✅ Googleアカウントでのログイン" }),
            /* @__PURE__ */ jsx("li", { children: "✅ 認証状態の管理" }),
            /* @__PURE__ */ jsx("li", { children: "✅ 保護されたルート" }),
            /* @__PURE__ */ jsx("li", { children: "✅ Firestoreへのユーザーデータ保存" }),
            /* @__PURE__ */ jsx("li", { children: "✅ ユーザープロフィール表示・編集" }),
            /* @__PURE__ */ jsx("li", { children: "✅ 最終ログイン時刻の記録" }),
            /* @__PURE__ */ jsx("li", { children: "✅ ログアウト機能" })
          ] })
        ] })
      ] })
    ] })
  ] }) }) });
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Dashboard,
  meta: meta$2
}, Symbol.toStringTag, { value: "Module" }));
function Home() {
  const { user, userProfile } = useAuth();
  return /* @__PURE__ */ jsxs("div", { children: [
    user && /* @__PURE__ */ jsx("div", { className: "mb-8", children: /* @__PURE__ */ jsx(UserProfile, { user, userProfile }) }),
    /* @__PURE__ */ jsx("div", { className: "w-full max-w-[300px] space-y-6 px-4", children: /* @__PURE__ */ jsxs("nav", { className: "space-y-4 rounded-3xl border border-gray-200 p-6 dark:border-gray-700", children: [
      /* @__PURE__ */ jsx("p", { className: "text-center text-gray-700 leading-6 dark:text-gray-200", children: "What's next?" }),
      /* @__PURE__ */ jsx("ul", { children: user && /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
        "a",
        {
          className: "group flex items-center gap-3 self-stretch p-3 text-blue-700 leading-normal hover:underline dark:text-blue-500",
          href: "/dashboard",
          children: [
            /* @__PURE__ */ jsxs(
              "svg",
              {
                className: "mr-2 h-5 w-5",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                children: [
                  /* @__PURE__ */ jsx("title", { children: "ダッシュボード" }),
                  /* @__PURE__ */ jsx(
                    "path",
                    {
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      strokeWidth: 2,
                      d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    }
                  )
                ]
              }
            ),
            "ダッシュボード"
          ]
        }
      ) }) })
    ] }) })
  ] });
}
function meta$1() {
  return [{
    title: "New React Router App"
  }, {
    name: "description",
    content: "Welcome to React Router!"
  }];
}
const _index = UNSAFE_withComponentProps(function Index() {
  return /* @__PURE__ */ jsx(Home, {});
});
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _index,
  meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
const GoogleIcon = () => /* @__PURE__ */ jsxs("svg", { className: "mr-2 h-5 w-5", viewBox: "0 0 24 24", children: [
  /* @__PURE__ */ jsx("title", { children: "Google logo" }),
  /* @__PURE__ */ jsx(
    "path",
    {
      fill: "currentColor",
      d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    }
  ),
  /* @__PURE__ */ jsx(
    "path",
    {
      fill: "currentColor",
      d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    }
  ),
  /* @__PURE__ */ jsx(
    "path",
    {
      fill: "currentColor",
      d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    }
  ),
  /* @__PURE__ */ jsx(
    "path",
    {
      fill: "currentColor",
      d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    }
  )
] });
function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("login");
  const handleGoogleAuth = async (isRegistration = false) => {
    try {
      setLoading(true);
      setError(null);
      if (isRegistration) {
        const result = await registerWithGoogle();
        if (result?.user) {
          await registerNewUser(result.user);
        }
      } else {
        const result = await signInWithGoogle();
        if (result?.user) {
          await loginExistingUser(result.user);
        }
      }
    } catch (error2) {
      console.error("Authentication error:", error2);
      if (error2 instanceof Error) {
        if (error2.message.includes("既に登録されています")) {
          setError("このGoogleアカウントは既に登録されています。ログインタブをお使いください。");
        } else if (error2.message.includes("登録されていません")) {
          setError("このGoogleアカウントは登録されていません。新規登録タブをお使いください。");
        } else {
          setError(isRegistration ? "新規登録に失敗しました。もう一度お試しください。" : "ログインに失敗しました。もう一度お試しください。");
        }
      } else {
        setError(isRegistration ? "新規登録に失敗しました。もう一度お試しください。" : "ログインに失敗しました。もう一度お試しください。");
      }
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-gray-50", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md space-y-8 p-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "mt-6 font-bold text-3xl text-gray-900", children: mode === "login" ? "ログイン" : "新規登録" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-600 text-sm", children: mode === "login" ? "Googleアカウントでログインしてください" : "新しいアカウントを作成してください" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex rounded-lg border border-gray-200 bg-gray-100 p-1", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setMode("login"),
          className: `w-1/2 rounded-md py-2 font-medium text-sm transition-all ${mode === "login" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`,
          children: "ログイン"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setMode("register"),
          className: `w-1/2 rounded-md py-2 font-medium text-sm transition-all ${mode === "register" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`,
          children: "新規登録"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      error && /* @__PURE__ */ jsx("div", { className: "rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700", children: error }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => handleGoogleAuth(mode === "register"),
          disabled: loading,
          className: `group relative flex w-full justify-center rounded-md border border-transparent px-4 py-3 font-medium text-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${mode === "login" ? "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500" : "bg-green-600 hover:bg-green-700 focus:ring-green-500"}`,
          children: loading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
            /* @__PURE__ */ jsx("div", { className: "-ml-1 mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" }),
            mode === "login" ? "ログイン中..." : "登録中..."
          ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
            /* @__PURE__ */ jsx(GoogleIcon, {}),
            mode === "login" ? "Googleでログイン" : "Googleで新規登録"
          ] })
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "text-center text-gray-500 text-xs", children: mode === "login" ? /* @__PURE__ */ jsxs("p", { children: [
        "まだアカウントをお持ちでない方は、",
        /* @__PURE__ */ jsx("br", {}),
        "上の「新規登録」タブをクリックしてください"
      ] }) : /* @__PURE__ */ jsxs("p", { children: [
        "既にアカウントをお持ちの方は、",
        /* @__PURE__ */ jsx("br", {}),
        "上の「ログイン」タブをクリックしてください"
      ] }) })
    ] })
  ] }) });
}
function meta() {
  return [
    { title: "ログイン - React Router App" },
    { name: "description", content: "ログインページ" }
  ];
}
function Login() {
  const { user, loading } = useAuth();
  const location = useLocation();
  let from = "/home";
  const state = location.state;
  if (state && typeof state === "object") {
    if ("from" in state) {
      const maybeFrom = state.from;
      if (maybeFrom?.pathname) {
        from = maybeFrom.pathname;
      }
    }
  }
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "読み込み中..." })
    ] }) });
  }
  if (user) {
    return /* @__PURE__ */ jsx(Navigate, { to: from, replace: true });
  }
  return /* @__PURE__ */ jsx(LoginPage, {});
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Login,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-BWxYzSXh.js", "imports": ["/assets/index-Cg5R3hIZ.js", "/assets/chunk-NISHYRIK-Duy3YP2V.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-DpV5fqZ7.js", "imports": ["/assets/index-Cg5R3hIZ.js", "/assets/chunk-NISHYRIK-Duy3YP2V.js", "/assets/auth-context-BQBhOI20.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/adjustment": { "id": "routes/adjustment", "parentId": "root", "path": "adjustment", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/adjustment-BdzpPVGC.js", "imports": ["/assets/index-Cg5R3hIZ.js", "/assets/user-profile-CsyVOoie.js", "/assets/auth-context-BQBhOI20.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/dashboard": { "id": "routes/dashboard", "parentId": "root", "path": "dashboard", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/dashboard-rZovnxcb.js", "imports": ["/assets/index-Cg5R3hIZ.js", "/assets/auth-context-BQBhOI20.js", "/assets/user-profile-CsyVOoie.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/_index-B6eXgXzR.js", "imports": ["/assets/chunk-NISHYRIK-Duy3YP2V.js", "/assets/index-Cg5R3hIZ.js", "/assets/user-profile-CsyVOoie.js", "/assets/auth-context-BQBhOI20.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/login": { "id": "routes/login", "parentId": "root", "path": "login", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/login-DSE_SWBC.js", "imports": ["/assets/index-Cg5R3hIZ.js", "/assets/chunk-NISHYRIK-Duy3YP2V.js", "/assets/auth-context-BQBhOI20.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-3594766c.js", "version": "3594766c", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v8_middleware": false, "unstable_optimizeDeps": false, "unstable_splitRouteModules": false, "unstable_subResourceIntegrity": false, "unstable_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/adjustment": {
    id: "routes/adjustment",
    parentId: "root",
    path: "adjustment",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/dashboard": {
    id: "routes/dashboard",
    parentId: "root",
    path: "dashboard",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route3
  },
  "routes/login": {
    id: "routes/login",
    parentId: "root",
    path: "login",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
