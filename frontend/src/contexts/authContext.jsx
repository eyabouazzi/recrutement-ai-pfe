import { createContext, useState, useEffect } from "react";
import { getMe } from "../api/auth";
const AuthContext = createContext(null);

// Also export as a named export so it can be imported with `{ AuthContext }`
export { AuthContext };

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('auth-token') || null);
    const [user, setUser] = useState(null);
    useEffect(() => {
        async function fetchMe() {
            if (!token) {
                setUser(null);
                localStorage.removeItem('auth-token');
                return;
            }
            try {
                localStorage.setItem('auth-token', token);
                const data = await getMe();
                if (data.status) {
                    setUser(data.user);
                } else {
                    // Token might be invalid
                    setToken(null);
                    setUser(null);
                    localStorage.removeItem('auth-token');
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                setToken(null);
                setUser(null);
                localStorage.removeItem('auth-token');
            }
        }
        fetchMe();
    }, [token]);
    return (
        <AuthContext.Provider value={{ token, setToken, user, setUser }} >
            {children}
        </AuthContext.Provider>
    )
};

export default AuthContext;
