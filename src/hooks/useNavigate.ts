import { useState, useEffect } from 'react';

let currentPath = window.location.hash.slice(1) || '/';
const listeners: Array<() => void> = [];

function notifyListeners() {
  listeners.forEach(listener => listener());
}

export function navigate(path: string) {
  window.location.hash = path;
  currentPath = path;
  notifyListeners();
}

export function useNavigate() {
  return navigate;
}

export function useLocation() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const listener = () => {
      const newPath = window.location.hash.slice(1) || '/';
      currentPath = newPath;
      setPath(newPath);
    };

    listeners.push(listener);
    window.addEventListener('hashchange', listener);

    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      window.removeEventListener('hashchange', listener);
    };
  }, []);

  return path;
}
