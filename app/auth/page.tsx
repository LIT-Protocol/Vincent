"use client";

import "./styles/login.css";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useAuthenticate from "@/components/login/hooks/useAuthenticate";
import useSession from "@/components/login/hooks/useSession";
import useAccounts from "@/components/login/hooks/useAccounts";
import { ORIGIN, registerWebAuthn } from "@/components/login/utils/lit";
import { AUTH_METHOD_TYPE } from "@lit-protocol/constants";
// import Dashboard from '@/components/login/components/Dashboard';
import Loading from "@/components/login/components/Loading";
import LoginMethods from "@/components/login/components/LoginMethods";
import SignUpMethods from "@/components/login/components/SignUpMethods";
import AccountSelection from "@/components/login/components/AccountSelection";
import CreateAccount from "@/components/login/components/CreateAccount";

export default function AuthView() {
    const [isLogin, setIsLogin] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const appId = searchParams.get("appId");

    const {
        authMethod,
        authWithEthWallet,
        authWithWebAuthn,
        authWithStytch,
        loading: authLoading,
        error: authError,
    } = useAuthenticate();

    const {
        fetchAccounts,
        createAccount,
        setCurrentAccount,
        currentAccount,
        accounts,
        loading: accountsLoading,
        error: accountsError,
    } = useAccounts();

    const {
        initSession,
        sessionSigs,
        loading: sessionLoading,
        error: sessionError,
    } = useSession();

    const error = authError || accountsError || sessionError;

    async function registerWithWebAuthn() {
        const newPKP = await registerWebAuthn();
        if (newPKP) {
            setCurrentAccount(newPKP);
        }
    }

    const toggleAuthMode = () => setIsLogin(!isLogin);

    useEffect(() => {
        if (authMethod) {
            const url = appId
                ? `${window.location.pathname}?appId=${appId}`
                : window.location.pathname;
            router.replace(url);

            if (isLogin) {
                fetchAccounts(authMethod);
            } else if (
                authMethod.authMethodType !== AUTH_METHOD_TYPE.WebAuthn
            ) {
                createAccount(authMethod);
            }
        }
    }, [authMethod, fetchAccounts, createAccount, isLogin, appId]);

    useEffect(() => {
        if (authMethod && currentAccount) {
            initSession(authMethod, currentAccount);
        }
    }, [authMethod, currentAccount, initSession]);

    if (authLoading) {
        return (
            <Loading
                copy={"Authenticating your credentials..."}
                error={error}
            />
        );
    }

    if (accountsLoading) {
        return (
            <Loading
                copy={
                    isLogin
                        ? "Looking up your accounts..."
                        : "Creating your account..."
                }
                error={error}
            />
        );
    }

    if (sessionLoading) {
        return <Loading copy={"Securing your session..."} error={error} />;
    }

    console.log("meow", currentAccount, sessionSigs);
    if (currentAccount && sessionSigs) {
        return (
            // <Dashboard currentAccount={currentAccount} sessionSigs={sessionSigs} />
            <div>
                <p>You are logged in!</p>
                <p>Current account: {currentAccount.ethAddress}</p>
            </div>
        );
    }

    // Login-specific views
    if (isLogin) {
        if (authMethod && accounts?.length > 0) {
            return (
                <AccountSelection
                    accounts={accounts}
                    setCurrentAccount={setCurrentAccount}
                    error={error}
                />
            );
        }

        if (authMethod && accounts?.length === 0) {
            return (
                <CreateAccount signUp={() => setIsLogin(false)} error={error} />
            );
        }

        return (
            <div className="login-page">
                <LoginMethods
                    authWithEthWallet={authWithEthWallet}
                    authWithWebAuthn={authWithWebAuthn}
                    // authWithStytch={authWithStytch}
                    signUp={() => setIsLogin(false)}
                    error={error}
                />
            </div>
        );
    }

    // Sign-up view
    return (
        <div className="login-page">
            <SignUpMethods
                authWithEthWallet={authWithEthWallet}
                registerWithWebAuthn={registerWithWebAuthn}
                authWithWebAuthn={authWithWebAuthn}
                // authWithStytch={authWithStytch}
                goToLogin={() => setIsLogin(true)}
                error={error}
            />
        </div>
    );
}
