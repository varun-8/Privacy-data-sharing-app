import { createContext, useState } from "react";

const urlContext = createContext();

const UrlProvider = ({ children }) => {
  const [url, setUrl] = useState("http://192.168.67.33:5000");

  return (
    <urlContext.Provider value={{ url, setUrl }}>
      {children}
    </urlContext.Provider>
  );
};

export { urlContext, UrlProvider };
