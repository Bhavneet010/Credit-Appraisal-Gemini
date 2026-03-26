import React, { useState, useEffect } from 'react';
import { Github, LogOut, BookMarked, Star, GitFork, Download } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cloningRepo, setCloningRepo] = useState<string | null>(null);
  const [cloneSuccess, setCloneSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();

    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkAuth();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/github/user');
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setIsAuthenticated(true);
        fetchRepos();
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error(err);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepos = async () => {
    try {
      const res = await fetch('/api/github/repos');
      if (res.ok) {
        const data = await res.json();
        setRepos(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnect = async () => {
    try {
      const redirectUri = `${window.location.origin}/api/auth/github/callback`;
      const response = await fetch(`/api/auth/github/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get auth URL');
      }
      const { url } = await response.json();

      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        setError('Please allow popups for this site to connect your account.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/github/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setUser(null);
    setRepos([]);
  };

  const handleClone = async (fullName: string) => {
    setCloningRepo(fullName);
    setError('');
    setCloneSuccess(null);
    try {
      const res = await fetch('/api/github/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName })
      });
      if (!res.ok) throw new Error('Failed to load repository');
      setCloneSuccess(`Successfully loaded ${fullName} into the workspace! Let the AI know you're ready.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCloningRepo(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Github className="w-6 h-6" />
          <h1 className="text-xl font-semibold tracking-tight">GitHub Explorer</h1>
        </div>
        {isAuthenticated && user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={user.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-200" />
              <span className="text-sm font-medium">{user.login}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto p-6 mt-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
            {error}
          </div>
        )}
        {cloneSuccess && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm font-medium">
            {cloneSuccess}
          </div>
        )}

        {!isAuthenticated ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center max-w-md mx-auto mt-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Github className="w-8 h-8 text-gray-900" />
            </div>
            <h2 className="text-2xl font-semibold mb-2 tracking-tight">Connect your GitHub</h2>
            <p className="text-gray-500 mb-8 text-sm">
              Authenticate with GitHub to view your repositories and activity directly in this app.
            </p>
            <button
              onClick={handleConnect}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Github className="w-5 h-5" />
              Connect GitHub Account
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold mb-6 tracking-tight">Recent Repositories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repos.map((repo) => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white p-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 text-blue-600 font-medium group-hover:underline">
                      <BookMarked className="w-4 h-4" />
                      <span className="truncate">{repo.name}</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full border border-gray-200 capitalize">
                      {repo.visibility}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">
                    {repo.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {repo.language && (
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                        {repo.language}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" />
                      {repo.stargazers_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5" />
                      {repo.forks_count}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleClone(repo.full_name);
                      }}
                      disabled={cloningRepo === repo.full_name}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {cloningRepo === repo.full_name ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {cloningRepo === repo.full_name ? 'Loading Workspace...' : 'Load into Workspace'}
                    </button>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
