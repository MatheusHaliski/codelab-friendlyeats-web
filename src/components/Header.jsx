"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  signInWithGoogle,
  signOut,
  onIdTokenChanged,
} from "@/src/lib/firebase/auth.js";
import { setCookie, deleteCookie } from "cookies-next";

function useUserSession(initialUser) {
  const [user, setUser] = useState(initialUser ?? null);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged((firebaseUser) => {
      if (!firebaseUser) {
        deleteCookie("token");
        setUser(null);
        return;
      }

      (async () => {
        const token = await firebaseUser.getIdToken();
        setCookie("token", token);
        setUser(firebaseUser.toJSON ? firebaseUser.toJSON() : firebaseUser);
      })();
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  return user;
}

export default function Header({ initialUser }) {
  const user = useUserSession(initialUser);

  const handleSignOut = (event) => {
    event.preventDefault();
    signOut();
  };

  const handleSignIn = (event) => {
    event.preventDefault();
    signInWithGoogle();
  };

  return (
    <header>
      <Link href="/" className="logo">
        <img src="/friendly-eats.svg" alt="FriendlyEats" />
        Friendly Eats
      </Link>
      {user ? (
        <>
          <div className="profile">
            <p>
              <img
                className="profileImage"
                src={user.photoURL || "/profile.svg"}
                alt={user.email}
              />
              {user.displayName}
            </p>

            <div className="menu">
              ...
              <ul>
                <li>{user.displayName}</li>

                <li>
                  <a href="#" onClick={handleSignOut}>
                    Sign Out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="profile">
          <a href="#" onClick={handleSignIn}>
            <img src="/profile.svg" alt="A placeholder user image" />
            Sign In with Google
          </a>
        </div>
      )}
    </header>
  );
}
