import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/index.js';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { DataProvider } from './contexts/DataContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <AuthProvider>
          <DataProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </DataProvider>
        </AuthProvider>
      </Provider>
    </BrowserRouter>
  </StrictMode>
);

