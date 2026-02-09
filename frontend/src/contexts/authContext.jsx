import { createContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// Also export as a named export so it can be imported with `{ AuthContext }`
export { AuthContext };

export const AuthProvider = ({children}) => {
    const [token, setToken ] = useState(localStorage.getItem('auth-token') || null);
    useEffect(() => {
       
        if(token){
            localStorage.setItem('auth-token', token);   
        }
    }, [token]);
    return(
        <AuthContext.Provider value={{token, setToken}} >
            {children}
        </AuthContext.Provider>
    )};

export default AuthContext;
