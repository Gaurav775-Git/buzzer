import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { io } from 'socket.io-client';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'https://buzzer-hl85.onrender.com';

const socket = io(API_BASE, {
  autoConnect: false,
});

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);

  return {
    time: date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    }),
    date: date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }),
  };
};

const getRankBadge = (index) => {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `#${index + 1}`;
};

const BuzzerPage = () => {
  const [teamName, setTeamName] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleBuzz = async () => {
    const normalizedName = teamName.trim();

    if (!normalizedName) {
      setError('Team name is required.');
      setSuccess('');
      return;
    }

    try {
      setError('');
      const payload = {
        teamName: normalizedName,
        timestamp: Date.now(),
      };

      const response = await fetch(`${API_BASE}/api/buzz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Unable to submit buzzer right now.');
      }

      setIsPressed(true);
      setSuccess('✓ Buzzer Pressed! Your time has been recorded.');
    } catch (requestError) {
      setError(requestError.message || 'Unable to submit buzzer right now.');
      setSuccess('');
    }
  };

  return (
    <main className="page buzzer-page">
      <div className="buzzer-shell atmospheric-card">
        <h2 className="section-title">TEAM BUZZER</h2>
        <label className="field-label" htmlFor="teamName">
          Team Name
        </label>
        <input
          id="teamName"
          className="team-input"
          type="text"
          value={teamName}
          onChange={(event) => setTeamName(event.target.value)}
          placeholder="Enter your team"
          disabled={isPressed}
          maxLength={50}
        />
        <button
          type="button"
          className="buzz-button"
          onClick={handleBuzz}
          disabled={isPressed}
        >
          BUZZ!
        </button>
        {error && <p className="message message-error">{error}</p>}
        {success && <p className="message message-success">{success}</p>}
      </div>
    </main>
  );
};

const AdminPage = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [buzzes, setBuzzes] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchBuzzes = async () => {
    try {
      setIsLoading(true);
      setLoadError('');
      const response = await fetch(`${API_BASE}/api/buzz`);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data.');
      }

      const data = await response.json();
      setBuzzes(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setLoadError(requestError.message || 'Failed to fetch leaderboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    fetchBuzzes();

    socket.connect();

    const onNewBuzz = (newBuzz) => {
      setBuzzes((currentBuzzes) => {
        const updatedBuzzes = [...currentBuzzes, newBuzz];
        updatedBuzzes.sort((a, b) => a.timestamp - b.timestamp);
        return updatedBuzzes;
      });
    };

    socket.on('new-buzz', onNewBuzz);

    return () => {
      socket.off('new-buzz', onNewBuzz);
      socket.disconnect();
    };
  }, [isAuthenticated]);

  const handleLogin = (event) => {
    event.preventDefault();

    if (password === 'admin123') {
      setIsAuthenticated(true);
      setAuthError('');
      return;
    }

    setAuthError('Invalid password.');
    setIsAuthenticated(false);
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm('Clear all buzz records? This cannot be undone.');

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/buzz`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer admin123',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear buzz records.');
      }

      setBuzzes([]);
    } catch (requestError) {
      setLoadError(requestError.message || 'Failed to clear buzz records.');
    }
  };

  const leaderboard = useMemo(
    () => [...buzzes].sort((a, b) => a.timestamp - b.timestamp),
    [buzzes],
  );

  if (!isAuthenticated) {
    return (
      <main className="page admin-page">
        <section className="admin-login atmospheric-card">
          <h2 className="section-title">ADMIN ACCESS</h2>
          <form onSubmit={handleLogin} className="login-form">
            <label className="field-label" htmlFor="adminPassword">
              Password
            </label>
            <input
              id="adminPassword"
              type="password"
              className="team-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
            />
            <button className="btn btn-primary" type="submit">
              Login
            </button>
            {authError && <p className="message message-error">{authError}</p>}
          </form>
          <Link to="/" className="btn btn-ghost full-width">
            Back Home
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page admin-page">
      <section className="admin-panel atmospheric-card">
        <header className="admin-header">
          <h2 className="section-title">LIVE LEADERBOARD</h2>
          <div className="admin-actions">
            <button type="button" className="btn btn-ghost" onClick={fetchBuzzes}>
              Refresh
            </button>
            <button type="button" className="btn btn-primary" onClick={handleClearAll}>
              Clear All
            </button>
            <Link to="/" className="btn btn-ghost" onClick={() => setIsAuthenticated(false)}>
              Logout
            </Link>
          </div>
        </header>

        {loadError && <p className="message message-error">{loadError}</p>}
        {isLoading && <p className="message message-neutral">Loading leaderboard...</p>}

        <div className="table-wrap">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Time</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan="4" className="empty-cell">
                    No buzzes yet.
                  </td>
                </tr>
              )}
              {leaderboard.map((entry, index) => {
                const formatted = formatTimestamp(entry.timestamp);

                return (
                  <tr key={entry._id || `${entry.teamName}-${entry.timestamp}`} className={index === 0 ? 'winner-row' : ''}>
                    <td>{getRankBadge(index)}</td>
                    <td>
                      {entry.teamName}
                      {index === 0 && <span className="winner-badge">WINNER 🏆</span>}
                    </td>
                    <td>{entry.time || formatted.time}</td>
                    <td>{entry.date || formatted.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<BuzzerPage />} />
      <Route path="/buzzer" element={<Navigate to="/" replace />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
