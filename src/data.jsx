import { createContext, useContext, useEffect, useState } from "react";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    courses: [],
    subjects: [],
    sessions: [],
    teachers: [],
    courseTeachers: [],
    events: [],
    reviews: [],
    notifications: [],
    contacts: [],
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
          subjects: data.subjects || [],
          sessions: data.sessions || [],
          teachers: data.teachers || [],
          courseTeachers: data.courseTeachers || [],
          events: data.events || [],
          reviews: data.reviews || [],
          notifications: data.notifications || [],
          contacts: data.contacts || [],
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
