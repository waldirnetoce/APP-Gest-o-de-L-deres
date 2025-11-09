import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import { User, getUser, isSetupNeeded } from './api';
import { LoginIcon } from './components/icons';
import SetupWizard from './SetupWizard';
import { ThemeProvider } from './ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

const MainApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState<string>('waldir@example.com');
  const [password, setPassword] = useState<string>('Adm*2@2026');
  const [error, setError] = useState<string>('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);
  
  const needsSetup = isSetupNeeded();

  useEffect(() => {
    setInitialCheckDone(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const loggedInUser = getUser(email, password);
      setUser(loggedInUser);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setProfilePic(null); 
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
  }

  if (!initialCheckDone) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><p className="text-gray-900 dark:text-white">Carregando...</p></div>;
  }
  
  if (showSetup) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600 mb-2">
            KPI Manager
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Acesse para acompanhar sua equipe.</p>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-mail</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 transition-all text-gray-900 dark:text-white"
                placeholder="seu.email@example.com"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password"className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Senha</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 transition-all text-gray-900 dark:text-white"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-500 dark:text-red-400 text-sm text-center mb-4">{error}</p>}
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-6 py-3 text-lg font-bold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-500/50">
              <LoginIcon />
              Entrar
            </button>
            <div className="text-center mt-6">
              {needsSetup && (
                  <button onClick={() => setShowSetup(true)} className="text-sm text-sky-500 hover:underline">
                    Cadastrar Novo Projeto
                  </button>
              )}
               <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">Use 'waldir@example.com' (senha: Adm*2@2026) ou outros usuários com a senha 'password123'.</p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return <Dashboard user={user} onLogout={handleLogout} profilePic={profilePic} setProfilePic={setProfilePic} />;
};

export default App;