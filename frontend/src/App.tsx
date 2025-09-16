import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import AppRoutes from './AppRoutes';
import './index.css';

function App() {
  // Temporary debug - remove this after fixing the issue
  React.useEffect(() => {
    console.log('🔧 App started - Environment check:');
    console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔧 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('🔧 Current hostname:', window.location.hostname);
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </Provider>
  );
}

export default App;