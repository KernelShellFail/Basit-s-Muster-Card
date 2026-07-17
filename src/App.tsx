import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { router } from './router';
import { ToastContainer } from './components/Toast';

function App() {
  const { initApp } = useAppStore();

  useEffect(() => {
    initApp();
  }, [initApp]);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
}

export default App;
