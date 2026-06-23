import React, {createContext,useContext,useState,useEffect} from 'react';

const ThemeContext = createContext();

export function ThemeProvider({children}){
    const [darkMode,setDarkMode] = useState(
        () => localStorage.getItem('theme') === 'dark'
    );
    const [defaultLanguage,setDefaultLanguage] = useState(
        () => localStorage.getItem('defaultLanguage') || 'English'
    );
    useEffect(() =>{
        document.documentElement.setAttribute('data-theme',darkMode ? 'dark':'light');
        localStorage.setItem('theme',darkMode?'dark':'light');
    },[darkMode]);

    useEffect(() =>{
        localStorage.setItem('default Language',defaultLanguage);
    },[defaultLanguage]);

    return(
        <ThemeContext.Provider value={{darkMode,setDarkMode,defaultLanguage,setDefaultLanguage}}>
            {children}
        </ThemeContext.Provider>
    );
}
export const useTheme = () =>useContext(ThemeContext);