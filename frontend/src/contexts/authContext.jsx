import { createContext, useState, useEffect, useContext } from "react";
import { getMe } from "../api/auth";
import { clearStoredToken, getStoredToken, syncStoredToken } from "../utils/authStorage";
const AuthContext = createContext(null);

// Also export as a named export so it can be imported with `{ AuthContext }`
export { AuthContext };

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(getStoredToken);
    const [user, setUser] = useState(null);
    useEffect(() => {
        async function fetchMe() {
            if (!token) {
                setUser(null);
                clearStoredToken();
                return;
            }
            try {
                syncStoredToken(token);
                const data = await getMe();
                if (data.status) {
                    setUser(data.user);
                } else {
                    // Token might be invalid
                    setToken(null);
                    setUser(null);
                    clearStoredToken();
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                setToken(null);
                setUser(null);
                clearStoredToken();
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

// Convenience hook — used by WebSocketContext and others
export const useAuth = () => useContext(AuthContext);
