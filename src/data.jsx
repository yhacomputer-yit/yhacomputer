import { createContext, useContext, useEffect, useState } from "react";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    courses: [],
    events: [],
    reviews: [],
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/data");
        if (!res.ok) throw new Error("Request failed with status " + res.status);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (!active) return;
        setState({
          loading: false,
          error: null,
          courses: data.courses || [],
          events: data.events || [],
          reviews: data.reviews || [],
        });
      } catch (err) {
        if (!active) return;
        setState((s) => ({ ...s, loading: false, error: err.message || String(err) }));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
}

export function useSiteData() {
  return useContext(DataContext);
}
