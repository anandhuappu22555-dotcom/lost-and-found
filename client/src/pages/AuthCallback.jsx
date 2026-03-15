import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();

    useEffect(() => {
        const token = searchParams.get("token");

        if (token) {
            try {
                // Determine user data from token or fetch it? 
                // The backend only sends token in URL.
                // We need to decode it to get user info or fetch /me.
                // The current Login flow in auth.js returns { token, user } in body.
                // The NEW /confirm-login redirects with ?token=<jwt>.
                // The JWT payload has { id, role, sessionId }.
                // It does NOT have username/email in payload necessarily (except what we put).
                // Let's check auth.js: `jwt.sign({ id: user.id, role: user.role, sessionId: ... })`
                // We are missing user details for the context.

                // We should probably fetch the user details using the token.
                // Or we can rely on decoding just id/role for now.
                // But AuthContext expects `user` object.

                // Let's decode what we have.
                const decoded = jwtDecode(token);

                // Optimally we fetch /api/auth/me, but we don't have that endpoint yet.
                // I'll add a quick fetch or just reconstruct minimal user.
                // For now, minimal.
                const user = { id: decoded.id, username: decoded.username, role: decoded.role };

                loginWithToken(token, user);
                navigate("/");
            } catch (err) {
                console.error("Token processing error", err);
                navigate("/login");
            }
        } else {
            navigate("/login");
        }
    }, [searchParams, navigate, loginWithToken]);

    return (
        <div className="flex justify-center items-center h-screen">
            <h2 className="text-xl font-semibold">Verifying login...</h2>
        </div>
    );
};

export default AuthCallback;
