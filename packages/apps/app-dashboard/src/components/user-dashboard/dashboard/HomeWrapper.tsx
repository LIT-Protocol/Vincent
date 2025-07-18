import { useReadAuthInfo } from "@/hooks/user-dashboard/useAuthInfo";
import { AuthenticationErrorScreen } from "../consent/AuthenticationErrorScreen";
import { ThemedLoading } from "./ui/ThemedLoading";
import { Navigate } from "react-router-dom";
import SharedHome from "@/pages/shared/RootPage";

export function HomeWrapper() {
    const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();

    // Show skeleton while auth is processing
    if (isProcessing) {
        return <ThemedLoading />;
    }

    // Handle auth errors early
    if (error) {
        return <AuthenticationErrorScreen />;
    }
    
    const isUserAuthed = authInfo?.userPKP && authInfo?.agentPKP && sessionSigs;
    
    // If authenticated, redirect to /user/apps
    if (isUserAuthed) {
        return <Navigate to="/user/apps" replace />;
    }
    
    // If not authenticated, show the SharedHome component (this won't actually be shown, since when not authenticated we should the AuthenticationErrorScreen)
    return <SharedHome />;
}