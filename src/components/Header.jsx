"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { setCookie, deleteCookie } from "cookies-next";
import {
  signInWithGoogle,
  signOut,
  onIdTokenChanged,
} from "@/src/lib/firebase/auth";

function useUserSession(initialUser) {
  const [user, setUser] = useState(initialUser || null);

  useEffect(() => {
    setUser(initialUser || null);
  }, [initialUser]);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const token = await firebaseUser.getIdToken();

        // 🔐 salva o token em cookie (para autenticação server-side)
        setCookie("firebaseAuthToken", token, {
          path: "/",
          maxAge: 60 * 60 * 24 * 5, // 5 dias
        });
      } else {
        setUser(null);
        deleteCookie("firebaseAuthToken", { path: "/" });
      }
    });

    return () => unsubscribe?.();
  }, []);

  return [user, setUser];
}

export default function Header({ initialUser }) {
  const [user, setUser] = useUserSession(initialUser);

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const result = await signInWithGoogle();
      // 🔹 Atualiza o estado imediatamente após login
      setUser(result.user);
      console.log("Usuário autenticado:", result.user.displayName);
    } catch (err) {
      console.error("Erro ao fazer login com Google:", err);
    }
  };

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      deleteCookie("firebaseAuthToken", { path: "/" });
      setUser(null);
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  };

  return (
    <header className="header">
      <Link href="/" className="logo">
        <img src="/friendly-eats.svg" alt="FriendlyEats" height={32} />
        <span>Friendly Eats</span>
      </Link>

      <div className="auth-controls">
        {user ? (
          <div className="profile">
            <img
              src={user.photoURL || "/default-avatar.png"}
              alt={user.displayName || "Usuário"}
              className="avatar"
            />
            <span className="username">
              {user.displayName || "Usuário autenticado"}
            </span>
            <button onClick={handleSignOut} className="logout-btn">
              Sign Out
            </button>
          </div>
        ) : (
          <button onClick={handleSignIn} className="login-btn">
            Sign In with Google
          </button>
        )}
      </div>

      <style jsx>{`
          .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 1rem 2rem;
              background: #2a4d95;
              border-bottom: 1px solid #ddd;
          }

          .logo {
              display: flex;
              align-items: center;
              gap: 8px;
              text-decoration: none;
              color: #333;
              font-weight: bold;
          }

          .auth-controls {
              display: flex;
              align-items: center;
              gap: 12px;
          }

          .profile {
              display: flex;
              align-items: center;
              gap: 10px;
          }

          .avatar {
              width: 36px;
              height: 36px;
              border-radius: 50%;
          }

          .login-btn,
          .logout-btn {
              background-color: #ff6600;
              color: #f5f5f6;
              border: none;
              border-radius: 6px;
              padding: 0.5rem 1rem;
              cursor: pointer;
              font-weight: 500;
          }

          .login-btn:hover,
          .logout-btn:hover {
              background-color: #e05500;
          }
      `}</style>
    </header>
  );
}
