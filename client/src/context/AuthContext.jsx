import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const storedUser = sessionStorage.getItem("user");

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }

        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const res = await api.post("auth/login", {
                email,
                password,
            });

            if (res.data.success) {
                const { token, user: userData } = res.data;
                sessionStorage.setItem("token", token);
                sessionStorage.setItem("user", JSON.stringify(userData));
                setUser(userData);
                return { success: true, message: res.data.message };
            }
            return { success: false, error: res.data.message };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || "Login failed"
            };
        }
    };

    // ✅ Forgot Password
    const forgotPassword = async (email) => {
        try {
            const res = await api.post("auth/forgot-password", { email });
            return { success: true, message: res.data.message };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || "Request failed" };
        }
    };

    // ✅ Reset Password
    const resetPassword = async (token, newPassword) => {
        try {
            const res = await api.post("auth/reset-password", {
                token,
                newPassword
            });
            return { success: true, message: res.data.message };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || "Reset failed" };
        }
    };

    const register = async (username, email, password) => {
        try {
            const res = await api.post("auth/register", {
                username,
                email,
                password,
            });

            // Phase 3 Integration: Leverage backend success/message
            if (res.data.success) {
                // Auto-login after registration if token is provided
                if (res.data.token && res.data.user) {
                    sessionStorage.setItem("token", res.data.token);
                    sessionStorage.setItem("user", JSON.stringify(res.data.user));
                    setUser(res.data.user);
                }
                return { success: true, message: res.data.message };
            }
            return { success: false, error: res.data.message };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || "Registration encountered an error"
            };
        }
    };

    // ✅ Login with Token (Called from Callback)
    const loginWithToken = (token, userData) => {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    };

    // ✅ Logout
    const logout = () => {
        sessionStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                register,
                forgotPassword,
                resetPassword,
                loginWithToken,
                logout,
                loading,
            }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);