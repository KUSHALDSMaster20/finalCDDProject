
import { useCallback, useEffect, useRef, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '';
const STORAGE = 'campus-session-token';

const pages = [
  ['home', 'space_dashboard', 'Overview'],
  ['resources', 'inventory_2', 'Resource board'],
  ['classes', 'school', 'Online classes'],
  ['meetings', 'video_call', 'Call Faculty'],
  ['translator', 'translate', 'Translator'],
  ['assistant', 'graphic_eq', 'AI assistant'],
  ['profile', 'account_circle', 'My Profile'],
];

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem(STORAGE) || ''
  );

  const [theme, setTheme] = useState(
    () => localStorage.getItem('campus-theme') || 'light'
  );

  const [user, setUser] = useState(null);
  const [page, setPage] = useState('home');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [room, setRoom] = useState('');
  const [featureConfig, setFeatureConfig] = useState(null);

  // Apply and remember the selected theme.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('campus-theme', theme);
  }, [theme]);

  // Common API request function.
  const request = useCallback(async (path, options = {}) => {
    let response;

    try {
      response = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          ...(options.body
            ? { 'Content-Type': 'application/json' }
            : {}),
          ...(token
            ? { Authorization: `Bearer ${token}` }
            : {}),
          ...options.headers,
        },
      });
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(
          'Campus Commons could not reach its API. Start Docker Compose and make sure XAMPP MySQL is running.'
        );
      }
      throw error;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error || 'The request could not be completed.'
      );
    }

    return data;
  }, [token]);

  // Verify the current login session.
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    request('/api/auth/me')
      .then(({ user: account }) => {
        setUser(account);
        setPage('home');
      })
      .catch(() => {
        localStorage.removeItem(STORAGE);
        setToken('');
        setUser(null);
      });
  }, [token, request]);

  // Load application feature configuration.
  useEffect(() => {
    if (!user) {
      setFeatureConfig(null);
      return;
    }

    request('/api/config/features')
      .then(setFeatureConfig)
      .catch(() =>
        setFeatureConfig({
          translationConfigured: false,
          aiConfigured: false,
        })
      );
  }, [user, request]);

  // Automatically clear notifications.
  useEffect(() => {
    if (!notice) return undefined;

    const timer = setTimeout(() => setNotice(''), 4500);

    return () => clearTimeout(timer);
  }, [notice]);

  const logout = () => {
    localStorage.removeItem(STORAGE);
    setToken('');
    setUser(null);
    setRoom('');
    setPage('home');
  };

  const handleLogin = (result) => {
    localStorage.setItem(STORAGE, result.token);
    setToken(result.token);
    setUser(result.user);
    setPage('home');
  };

  if (!user) {
    return (
      <AuthScreen
        request={request}
        onLogin={handleLogin}
      />
    );
  }

  const isTeacher =
    user.role === 'teacher' || user.role === 'lecturer';

  const currentTitle =
    pages.find((item) => item[0] === page)?.[2] ||
    'Student records';

  return (
    <div className="app-frame">

      {/* SIDEBAR */}
      <aside className="app-sidebar">

        <a
          className="brand"
          href="#home"
          onClick={() => setPage('home')}
        >
          <span className="brand-mark">C</span>
          <span>
            Campus<span className="brand-light">Commons</span>
          </span>
        </a>

        <div className="sidebar-caption">
          CAMPUS SPACE
        </div>

        <nav className="side-links" aria-label="Main menu">
          {pages.map(([id, icon, label]) => (
            <button
              key={id}
              className={
                page === id
                  ? 'side-link active'
                  : 'side-link'
              }
              onClick={() => {
                setPage(id);
                setRoom('');
                setError('');
              }}
            >
              <span className="material-symbols-rounded">
                {icon}
              </span>

              {label}

              {id === 'assistant' && (
                <span className="new-pill">AI</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">

          <div className="help-card">
            <span className="material-symbols-rounded">
              waving_hand
            </span>

            <b>Need a hand?</b>

            <small>
              Ask your learning assistant any time.
            </small>

            <button onClick={() => setPage('assistant')}>
              Talk to assistant <span>↗</span>
            </button>
          </div>

          <div className="sidebar-user">
            <span className="avatar">
              {user.name?.[0]?.toUpperCase()}
            </span>

            <div>
              <b>{user.name}</b>
              <small>
                {isTeacher ? 'Faculty' : user.role}
              </small>
            </div>

            <button
              aria-label="Sign out"
              onClick={logout}
            >
              <span className="material-symbols-rounded">
                logout
              </span>
            </button>
          </div>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-area">

        {/* TOPBAR */}
        <header className="topbar">

          <div className="mobile-brand">
            <span className="brand-mark">C</span>
            Campus Commons
          </div>

          <div className="breadcrumb">
            Learning space <span>›</span> {currentTitle}
          </div>

          <div className="top-actions">

            <button
              className="theme-toggle"
              onClick={() =>
                setTheme((current) =>
                  current === 'light' ? 'dark' : 'light'
                )
              }
              title="Toggle dark mode"
              aria-label="Toggle dark mode"
            >
              <span className="material-symbols-rounded">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>

            <span className="today-label">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>

            <button
              className="icon-button"
              aria-label="Open assistant"
              onClick={() => setPage('assistant')}
            >
              <span className="material-symbols-rounded">
                auto_awesome
              </span>
            </button>

            <span className="avatar top-avatar">
              {user.name?.[0]?.toUpperCase()}
            </span>

          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="content-wrap">

          {notice && (
            <div
              className="alert alert-success py-2"
              role="status"
            >
              {notice}
            </div>
          )}

          {error && (
            <div
              className="alert alert-danger py-2"
              role="alert"
            >
              {error}

              <button
                className="btn-close float-end"
                aria-label="Dismiss"
                onClick={() => setError('')}
              />
            </div>
          )}

          {page === 'home' && (
            <Overview
              user={user}
              isTeacher={isTeacher}
              onNavigate={setPage}
            />
          )}

          {page === 'resources' && (
            <ResourceBoard
              user={user}
              isTeacher={isTeacher}
              request={request}
              setError={setError}
              setNotice={setNotice}
            />
          )}

          {page === 'classes' && (
            <Classroom
              user={user}
              isTeacher={isTeacher}
              request={request}
              onJoin={setRoom}
              setError={setError}
              setNotice={setNotice}
            />
          )}

          {page === 'meetings' && (
            <FamilyMeetings
              user={user}
              request={request}
              onJoin={setRoom}
              setError={setError}
              setNotice={setNotice}
            />
          )}

          {page === 'translator' && (
            <Translator
              request={request}
              setError={setError}
              configured={featureConfig?.translationConfigured}
            />
          )}

          {page === 'assistant' && (
            <Assistant
              request={request}
              setError={setError}
              aiConfigured={featureConfig?.aiConfigured}
            />
          )}

          {page === 'profile' && (
            <Profile
              user={user}
              request={request}
              setError={setError}
            />
          )}

        </div>

        <footer className="app-footer">
          Campus Commons <span>·</span>
          Learn together, wherever you are.
        </footer>

      </main>

      {/* VIDEO ROOM */}
      {room && (
        <VideoRoom
          code={room}
          user={user}
          token={token}
          onClose={() => setRoom('')}
          setError={setError}
        />
      )}

    </div>
  );
}


// =====================================================
// PROFILE
// =====================================================

function Profile({ user, request, setError }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    request('/api/resources')
      .then((items) => {
        if (!active) return;

        setReservations(
          items.filter((item) =>
            Number(item.booked_by) === Number(user.id) &&
            item.status === 'Booked'
          )
        );
      })
      .catch((error) => {
        if (active) setError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [request, user.id, setError]);

  const isFaculty =
    user.role === 'teacher' || user.role === 'lecturer';

  return (
    <>
      <PageHeader
        kicker="YOUR CAMPUS ACCOUNT"
        title="My Profile"
        copy="View your account information and active resource reservations."
      />

      <section className="profile-card">

        <div className="profile-avatar">
          {user.name?.[0]?.toUpperCase()}
        </div>

        <div>
          <h2>{user.name}</h2>
          <p>{isFaculty ? 'Faculty Member' : 'Student'}</p>
        </div>

      </section>

      <section className="profile-details">

        <h2>Personal Information</h2>

        <div className="profile-info-grid">

          <div>
            <small>Full Name</small>
            <b>{user.name}</b>
          </div>

          <div>
            <small>Email Address</small>
            <b>{user.email}</b>
          </div>

          <div>
            <small>Campus ID</small>
            <b>{user.campusId || 'Not provided'}</b>
          </div>

          <div>
            <small>Department</small>
            <b>{user.department || 'Not provided'}</b>
          </div>

          <div>
            <small>Account Type</small>
            <b>{user.role}</b>
          </div>

        </div>
      </section>

      <section className="profile-details">

        <h2>My Active Reservations</h2>

        {loading ? (
          <p>Loading reservations...</p>
        ) : reservations.length > 0 ? (

          <div className="profile-reservations">

            {reservations.map((item) => (
              <div
                className="profile-reservation"
                key={item.id}
              >
                <span className="material-symbols-rounded">
                  inventory_2
                </span>

                <div>
                  <b>{item.name}</b>
                  <small>{item.category}</small>
                </div>

                <span className="availability">
                  Reserved
                </span>
              </div>
            ))}

          </div>

        ) : (
          <p>You currently have no active reservations.</p>
        )}

      </section>
    </>
  );
}


// =====================================================
// AUTHENTICATION
// =====================================================

function AuthScreen({ request, onLogin }) {
  const [role, setRole] = useState('student');
  const [mode, setMode] = useState('login');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    campusId: '',
    department: '',
  });

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const path =
        mode === 'login'
          ? '/api/auth/login'
          : '/api/auth/register';

      const result = await request(path, {
        method: 'POST',
        body: JSON.stringify({ ...form, role }),
      });

      onLogin(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen">

      <section className="auth-visual">

        <a className="brand auth-brand" href="#">
          <span className="brand-mark">C</span>
          <span>
            Campus<span className="brand-light">Commons</span>
          </span>
        </a>

        <div className="auth-visual-copy">

          <span className="eyebrow">
            YOUR CAMPUS, CONNECTED
          </span>

          <h1>
            Learning grows
            <br />
            when we <em>share.</em>
          </h1>

          <p>
            Classes, conversations, resources and support—all
            in one friendly campus space.
          </p>

          <div className="visual-cards">

            <div className="visual-card visual-one">
              <span className="material-symbols-rounded">
                video_call
              </span>
              <b>Learn together</b>
              <small>Live classes and faculty calls</small>
            </div>

            <div className="visual-card visual-two">
              <span className="material-symbols-rounded">
                auto_awesome
              </span>
              <b>Curiosity, answered</b>
              <small>Your AI learning companion</small>
            </div>

          </div>
        </div>

        <div className="visual-orbit orbit-a" />
        <div className="visual-orbit orbit-b" />

      </section>

      <section className="auth-panel-wrap">

        <div className="auth-panel">

          <div className="role-pills">

            {[
              ['student', 'school'],
              ['teacher', 'cast_for_education'],
            ].map(([r, icon]) => (
              <button
                key={r}
                className={role === r ? 'selected' : ''}
                onClick={() => {
                  setRole(r);
                  setError('');
                }}
              >
                <span className="material-symbols-rounded">
                  {icon}
                </span>
                {r === 'teacher' ? 'Faculty' : 'Student'}
              </button>
            ))}

          </div>

          <div className="auth-heading">

            <span className="eyebrow">
              {role === 'teacher'
                ? 'FACULTY'
                : role.toUpperCase()} PORTAL
            </span>

            <h2>
              {mode === 'login'
                ? 'Welcome back'
                : 'Create your account'}
            </h2>

            <p>
              {mode === 'login'
                ? 'Sign in to return to your learning space.'
                : 'A connected campus experience starts here.'}
            </p>

          </div>

          <form onSubmit={submit}>

            {mode === 'register' && (
              <>
                <label>Full name</label>

                <input
                  className="form-control"
                  required
                  maxLength="100"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Your name"
                />

                <label>
                  {role === 'student' ? 'Student ID' : 'Faculty ID'}
                </label>

                <input
                  className="form-control"
                  value={form.campusId}
                  onChange={(e) =>
                    setForm({ ...form, campusId: e.target.value })
                  }
                  placeholder="Optional ID"
                />

                {role === 'teacher' && (
                  <>
                    <label>Department</label>

                    <input
                      className="form-control"
                      value={form.department}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          department: e.target.value,
                        })
                      }
                      placeholder="e.g. Science"
                    />
                  </>
                )}
              </>
            )}

            <label>Email address</label>

            <input
              className="form-control"
              required
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              placeholder="you@school.edu"
            />

            <label>Password</label>

            <input
              className="form-control"
              required
              type="password"
              minLength="8"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              placeholder="At least 8 characters"
            />

            {error && (
              <div className="alert alert-danger mt-3 py-2">
                {error}
              </div>
            )}

            <button
              className="btn btn-primary auth-submit"
              disabled={busy}
            >
              {busy
                ? 'Please wait…'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}

              <span>→</span>
            </button>

          </form>

          <p className="auth-switch">

            {mode === 'login'
              ? 'New here?'
              : 'Already have an account?'}

            <button
              onClick={() => {
                setMode(
                  mode === 'login' ? 'register' : 'login'
                );
                setError('');
              }}
            >
              {mode === 'login'
                ? 'Create an account'
                : 'Sign in'}
            </button>

          </p>

          <div className="privacy-note">
            <span className="material-symbols-rounded">
              lock
            </span>
            Your password is encrypted before it is stored.
          </div>

        </div>

      </section>
    </main>
  );
}


// =====================================================
// COMMON PAGE HEADER
// =====================================================

function PageHeader({ kicker, title, copy, action }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{kicker}</span>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {action}
    </div>
  );
}


// =====================================================
// OVERVIEW DASHBOARD
// =====================================================

function Overview({ user, isTeacher, onNavigate }) {
  const quick = [
    ['classes', 'school', 'Join a class', 'See lessons and live sessions'],
    ['meetings', 'video_call', 'Meet together', 'Connect with campus faculty'],
    ['translator', 'translate', 'Translate', 'Make learning multilingual'],
    ['assistant', 'auto_awesome', 'Ask your assistant', 'Get a little learning help'],
  ];

  return (
    <>
      <section className="welcome-banner">

        <div className="welcome-text">

          <span className="eyebrow">
            {isTeacher ? 'TEACHING SPACE' : 'YOUR LEARNING SPACE'}
          </span>

          <h1>
            {isTeacher ? 'Good to see you' : 'Welcome'},
            {' '}
            {user.name?.split(' ')[0]}
            {' '}
            <span>✳</span>
          </h1>

          <p>
            {isTeacher
              ? 'Bring your students and learning resources together.'
              : 'A little progress today can lead to a big discovery tomorrow.'}
          </p>

          <button
            className="btn btn-light welcome-button"
            onClick={() =>
              onNavigate(isTeacher ? 'classes' : 'assistant')
            }
          >
            {isTeacher ? 'Plan a class' : 'Ask your assistant'}
            <span>→</span>
          </button>

        </div>

        <div className="welcome-art">
          <div className="art-sun" />
          <div className="art-book">✦</div>
          <div className="art-orbit" />
        </div>

      </section>

      <PageHeader
        kicker="CAMPUS TOOLS"
        title="Your learning, all together."
        copy="Pick up where you left off or explore something new."
      />

      <div className="quick-grid">

        {quick.map(([id, icon, title, copy], i) => (
          <button
            key={id}
            className={`quick-card quick-${i}`}
            onClick={() => onNavigate(id)}
          >
            <span className="quick-icon material-symbols-rounded">
              {icon}
            </span>

            <span className="quick-arrow">↗</span>

            <b>{title}</b>
            <small>{copy}</small>
          </button>
        ))}

      </div>

      <div className="two-column mt-4">

        <section className="info-card">

          <div className="card-heading">
            <div>
              <span className="eyebrow">HOW IT HELPS</span>
              <h3>One space for campus life</h3>
            </div>

            <span className="material-symbols-rounded soft-icon">
              diversity_3
            </span>
          </div>

          <div className="feature-row">
            <span className="material-symbols-rounded">videocam</span>
            <div>
              <b>Meet face to face</b>
              <small>
                Join a live lesson or faculty call from your browser.
              </small>
            </div>
          </div>

          <div className="feature-row">
            <span className="material-symbols-rounded">translate</span>
            <div>
              <b>Understand every lesson</b>
              <small>
                Translate learning notes and messages into another language.
              </small>
            </div>
          </div>

          <div className="feature-row">
            <span className="material-symbols-rounded">graphic_eq</span>
            <div>
              <b>Talk through a question</b>
              <small>
                Use voice or text to ask the learning assistant.
              </small>
            </div>
          </div>

        </section>

        <section className="quote-card">
          <span className="material-symbols-rounded">
            format_quote
          </span>

          <blockquote>
            “The beautiful thing about learning is that nobody
            can take it away from you.”
          </blockquote>

          <small>— B. B. King</small>

          <div className="quote-decoration">✳</div>
        </section>

      </div>
    </>
  );
}


// =====================================================
// RESOURCE BOARD
// =====================================================

function ResourceBoard({
  user,
  isTeacher,
  request,
  setError,
  setNotice,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Lab Equipment');

  const load = useCallback(() => {
    return request('/api/resources')
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [request, setError]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (e) => {
    e.preventDefault();

    try {
      const row = await request('/api/resources', {
        method: 'POST',
        body: JSON.stringify({ name, category }),
      });

      setItems((current) => [...current, row]);
      setName('');
      setNotice('Resource added to the campus board.');
    } catch (e) {
      setError(e.message);
    }
  };

  const book = async (item) => {
    try {
      const row = await request(
        `/api/resources/${item.id}/book`,
        {
          method: 'POST',
          body: '{}',
        }
      );

      setItems((current) =>
        current.map((x) => x.id === row.id ? row : x)
      );
    } catch (e) {
      setError(e.message);
    }
  };

  const shown = items.filter((x) =>
    (filter === 'All' || x.category === filter) &&
    x.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        kicker="SHARED CAMPUS INVENTORY"
        title="Resource board"
        copy="Find study spaces, equipment and useful learning materials."
        action={
          isTeacher && (
            <span className="live-label">
              <span />
              Teacher tools enabled
            </span>
          )
        }
      />

      {isTeacher && (
        <form className="add-resource-bar" onSubmit={add}>

          <input
            className="form-control"
            required
            maxLength="100"
            placeholder="Add a resource name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Lab Equipment</option>
            <option>Study Room</option>
            <option>Study Material</option>
          </select>

          <button className="btn btn-primary">
            ＋ Add resource
          </button>

        </form>
      )}

      <div className="resource-tools">

        <div className="filter-group">
          {[
            'All',
            'Lab Equipment',
            'Study Room',
            'Study Material',
          ].map((x) => (
            <button
              key={x}
              className={filter === x ? 'filter-active' : ''}
              onClick={() => setFilter(x)}
            >
              {x}
            </button>
          ))}
        </div>

        <input
          className="form-control search-input"
          placeholder="Search the board…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      {loading ? (
        <div className="loading-box">
          Loading resources…
        </div>
      ) : (
        <div className="resource-grid">

          {shown.map((x, i) => (
            <article
              className={`resource-tile tile-${i % 4}`}
              key={x.id}
            >
              <span className="material-symbols-rounded tile-art">
                {x.category === 'Study Room'
                  ? 'chair'
                  : x.category === 'Study Material'
                    ? 'menu_book'
                    : 'biotech'}
              </span>

              <span className="resource-category">
                {x.category}
              </span>

              <h3>{x.name}</h3>

              <div className="availability">
                <span
                  className={
                    x.status === 'Available'
                      ? 'dot-green'
                      : 'dot-orange'
                  }
                />

                {x.status === 'Available'
                  ? 'Available'
                  : `Reserved${x.booked_by_name
                    ? ` · ${x.booked_by_name}`
                    : ''}`}
              </div>

              {!isTeacher && (
                <button
                  className="btn btn-outline-primary w-100 mt-3"
                  disabled={
                    x.status !== 'Available' &&
                    Number(x.booked_by) !== Number(user.id)
                  }
                  onClick={() => book(x)}
                >
                  {x.status === 'Available'
                    ? 'Reserve this'
                    : Number(x.booked_by) === Number(user.id)
                      ? 'Return resource'
                      : 'In use'}
                </button>
              )}

            </article>
          ))}

        </div>
      )}

      {!loading && shown.length === 0 && (
        <div className="empty-state">
          <span className="material-symbols-rounded">
            search_off
          </span>
          <h3>No resources found</h3>
          <p>Try a different search or category.</p>
        </div>
      )}
    </>
  );
}


// =====================================================
// ONLINE CLASSES
// =====================================================

function ClassRoomCard({ item, onJoin }) {
  return (
    <article className="session-card">

      <div className="session-card-top">
        <span className="session-icon material-symbols-rounded">
          cast_for_education
        </span>
        <span className="session-status">ONLINE CLASS</span>
      </div>

      <h3>{item.title}</h3>

      <p>
        {item.subject} · hosted by {item.teacherName}
      </p>

      <div className="session-date">
        <span className="material-symbols-rounded">event</span>
        {new Date(item.startsAt).toLocaleString()}
      </div>

      <button
        className="btn btn-primary"
        onClick={() => onJoin(item.meetingCode)}
      >
        Join class <span>↗</span>
      </button>

    </article>
  );
}


function Classroom({
  user,
  isTeacher,
  request,
  onJoin,
  setError,
  setNotice,
}) {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [startsAt, setStartsAt] = useState('');

  const load = useCallback(() => {
    return request('/api/classes')
      .then(setItems)
      .catch((e) => setError(e.message));
  }, [request, setError]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e) => {
    e.preventDefault();

    try {
      const result = await request('/api/classes', {
        method: 'POST',
        body: JSON.stringify({ title, subject, startsAt }),
      });

      setNotice(
        `Class scheduled. Share room code ${result.meetingCode} with your students.`
      );

      setTitle('');
      setSubject('');
      setStartsAt('');
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <PageHeader
        kicker="LIVE LEARNING"
        title="Online classes"
        copy="Teach and learn together with a live video classroom."
        action={
          <span className="live-label">
            <span />
            Browser video
          </span>
        }
      />

      {isTeacher && (
        <form className="schedule-panel" onSubmit={create}>

          <div className="schedule-title">
            <span className="material-symbols-rounded">
              add_to_queue
            </span>
            <div>
              <b>Schedule a class</b>
              <small>
                Create a lesson room and share its code.
              </small>
            </div>
          </div>

          <div className="schedule-fields">

            <input
              className="form-control"
              required
              placeholder="Class title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              className="form-control"
              required
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            <input
              className="form-control"
              required
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />

            <button className="btn btn-primary">
              Schedule class
            </button>

          </div>
        </form>
      )}

      <div className="section-subhead">
        <div>
          <h2>
            {isTeacher
              ? 'Your campus classes'
              : 'Classes to join'}
          </h2>
          <p>
            Join a class using a room invitation from your teacher.
          </p>
        </div>
      </div>

      {items.length ? (
        <div className="session-grid">
          {items.map((x) => (
            <ClassRoomCard
              key={x.id}
              item={x}
              onJoin={onJoin}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="material-symbols-rounded">
            school
          </span>
          <h3>No classes scheduled yet</h3>
          <p>
            {isTeacher
              ? 'Create the first online class for your learners.'
              : 'Your teacher’s scheduled classes will appear here.'}
          </p>
        </div>
      )}

      <p className="fine-print">
        <span className="material-symbols-rounded">info</span>
        Video calls use peer-to-peer WebRTC. Camera and
        microphone access is required.
      </p>
    </>
  );
}


// =====================================================
// FACULTY MEETINGS
// =====================================================

function FamilyMeetings({
  user,
  request,
  onJoin,
  setError,
  setNotice,
}) {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');

  const load = useCallback(() => {
    return request('/api/meetings')
      .then(setItems)
      .catch((e) => setError(e.message));
  }, [request, setError]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e) => {
    e.preventDefault();

    try {
      const result = await request('/api/meetings', {
        method: 'POST',
        body: JSON.stringify({ title, startsAt }),
      });

      setNotice(
        `Faculty call scheduled. Share room code ${result.meetingCode} with the intended participants.`
      );

      setTitle('');
      setStartsAt('');
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <PageHeader
        kicker="STUDENT AND FACULTY CONNECTIONS"
        title="Call Faculty"
        copy="Schedule a video conversation with a teacher or faculty member."
      />

      <form className="schedule-panel" onSubmit={create}>

        <div className="schedule-title">
          <span className="material-symbols-rounded">
            groups
          </span>
          <div>
            <b>Schedule a faculty call</b>
            <small>
              Choose a time and share the private meeting room
              code with participants.
            </small>
          </div>
        </div>

        <div className="schedule-fields">

          <input
            className="form-control"
            required
            placeholder="Call topic"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            className="form-control"
            required
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />

          <button className="btn btn-primary">
            Schedule call
          </button>

        </div>
      </form>

      <div className="section-subhead">
        <div>
          <h2>Upcoming faculty calls</h2>
          <p>Scheduled conversations with teachers and faculty.</p>
        </div>
      </div>

      {items.length ? (
        <div className="session-grid">

          {items.map((x) => (
            <article
              className="session-card meeting-card"
              key={x.id}
            >

              <div className="session-card-top">
                <span className="session-icon material-symbols-rounded">
                  diversity_3
                </span>
                <span className="session-status">
                  FACULTY CALL
                </span>
              </div>

              <h3>{x.title}</h3>
              <p>Hosted by {x.hostName}</p>

              <div className="session-date">
                <span className="material-symbols-rounded">
                  event
                </span>
                {new Date(x.startsAt).toLocaleString()}
              </div>

              <button
                className="btn btn-primary"
                onClick={() => onJoin(x.meetingCode)}
              >
                Join call <span>↗</span>
              </button>

            </article>
          ))}

        </div>
      ) : (
        <div className="empty-state">
          <span className="material-symbols-rounded">
            calendar_month
          </span>
          <h3>No calls scheduled yet</h3>
          <p>
            Schedule a faculty call and share the room code
            with the intended participants.
          </p>
        </div>
      )}

      <p className="fine-print">
        <span className="material-symbols-rounded">info</span>
        Meeting codes are invitations. Share them only with
        the intended participants.
      </p>
    </>
  );
}


// =====================================================
// TRANSLATOR
// =====================================================

function Translator({ request, setError, configured }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [target, setTarget] = useState('hi');
  const [busy, setBusy] = useState(false);

  const languages = [
    ['hi', 'Hindi'],
    ['es', 'Spanish'],
    ['fr', 'French'],
    ['ar', 'Arabic'],
    ['bn', 'Bengali'],
    ['zh', 'Chinese'],
    ['de', 'German'],
    ['ja', 'Japanese'],
  ];

  const translate = async () => {
    setBusy(true);
    setError('');
    setResult('');

    try {
      const data = await request('/api/translate', {
        method: 'POST',
        body: JSON.stringify({
          text,
          targetLanguage: target,
        }),
      });

      setResult(data.translatedText);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        kicker="LANGUAGE SUPPORT"
        title="Say it another way."
        copy="Translate notes and messages to make learning easier to share."
      />

      <div className="translator-card">

        <div className="translate-language">
          <label>Translate into</label>

          <select
            className="form-select"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            {languages.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>

          <span className="powered-note">
            <span className="material-symbols-rounded">
              language
            </span>

            {configured === undefined
              ? 'Checking translation service…'
              : configured
                ? 'Self-hosted translation ready'
                : 'Translation service unavailable'}
          </span>
        </div>

        <div className="translator-columns">

          <div className="translate-pane">
            <div className="pane-head">
              Your text <span>Auto detect</span>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a lesson note, message or question…"
              maxLength={4000}
            />

            <small>{text.length}/4000</small>
          </div>

          <div className="translate-pane output-pane">
            <div className="pane-head">
              Translation
              <span className="material-symbols-rounded">
                translate
              </span>
            </div>

            <div className="translation-result">
              {result || (
                <span>Your translation will appear here.</span>
              )}
            </div>

            {result && (
              <button
                className="copy-button"
                onClick={() =>
                  navigator.clipboard?.writeText(result)
                }
              >
                Copy translation
              </button>
            )}
          </div>

        </div>

        <button
          className="btn btn-primary translate-button"
          disabled={!text.trim() || busy}
          onClick={translate}
        >
          <span className="material-symbols-rounded">
            translate
          </span>

          {busy ? 'Translating…' : 'Translate text'}
          <span>→</span>
        </button>

        <p className="fine-print">
          <span className="material-symbols-rounded">info</span>
          Translation runs through the campus self-hosted
          translation service. No Google key is required.
        </p>

      </div>
    </>
  );
}


// =====================================================
// AI ASSISTANT
// =====================================================

function Assistant({ request, setError, aiConfigured }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi! I’m your Campus Commons assistant. Ask me about classes, meetings, translation or study ideas. You can type or use the microphone.',
    },
  ]);

  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);

  const bottom = useRef(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  const send = async (value) => {
    const prompt = (value ?? text).trim();

    if (!prompt || busy) return;

    setText('');

    setMessages((current) => [
      ...current,
      { role: 'user', text: prompt },
    ]);

    setBusy(true);

    try {
      const data = await request('/api/assistant/chat', {
        method: 'POST',
          body: JSON.stringify({
            message: prompt,
            history: messages.slice(-12).map(({ role, text }) => ({ role, content: text })),
          }),
      });

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: data.answer,
        },
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const listen = () => {
    const Speech =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!Speech) {
      setError(
        'Speech recognition is not available in this browser. Try Chrome or type your question.'
      );
      return;
    }

    const recognition = new Speech();

    recognition.lang = navigator.language || 'en-US';

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (e) => {
      send(e.results[0][0].transcript);
    };

    recognition.start();
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      window.speechSynthesis.speak(
        new SpeechSynthesisUtterance(text)
      );
    }
  };

  return (
    <>
      <PageHeader
        kicker="YOUR LEARNING COMPANION"
        title="What are you curious about?"
        copy="Ask by text or voice. Your assistant can help with campus features and study ideas."
      />

      <div className="assistant-layout">

        <div className="chat-card">

          <div className="chat-top">

            <span className="assistant-orb material-symbols-rounded">
              auto_awesome
            </span>

            <div>
              <b>Campus assistant</b>
          <small>
                <span className="online-dot" />
                {aiConfigured ? 'AI service configured' : 'Campus help available'}
              </small>
            </div>

            <span className="chat-badge">
              {aiConfigured === undefined
                ? 'CHECKING'
                : aiConfigured
                ? 'OPENAI CONFIGURED'
                  : 'BUILT-IN MODE'}
            </span>

          </div>

          <div className="chat-messages">

            {messages.map((m, i) => (
              <div
                className={`chat-message ${m.role}`}
                key={i}
              >
                <span className="chat-avatar material-symbols-rounded">
                  {m.role === 'assistant'
                    ? 'auto_awesome'
                    : 'person'}
                </span>

                <div className="chat-bubble">
                  {m.text}

                  {m.role === 'assistant' && i > 0 && (
                    <button
                      className="speak-button"
                      aria-label="Read aloud"
                      onClick={() => speak(m.text)}
                    >
                      <span className="material-symbols-rounded">
                        volume_up
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div className="typing-indicator">
                Thinking through that…
              </div>
            )}

            <div ref={bottom} />

          </div>

          <form
            className="chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >

            <button
              type="button"
              className={
                listening
                  ? 'mic-button listening'
                  : 'mic-button'
              }
              onClick={listen}
              aria-label="Ask using voice"
            >
              <span className="material-symbols-rounded">
                mic
              </span>
            </button>

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask a question or get a study idea…"
            />

            <button
              className="send-button"
              disabled={!text.trim() || busy}
              aria-label="Send message"
            >
              <span className="material-symbols-rounded">
                arrow_upward
              </span>
            </button>

          </form>

        </div>

        <aside className="suggestion-panel">

          <span className="eyebrow">TRY ASKING</span>

          {[
            'How do I join an online class?',
            'Help me plan a 30-minute study session',
            'How can I book a resource?',
            'Can you help me translate a note?',
          ].map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
            >
              <span className="material-symbols-rounded">
                north_west
              </span>
              {q}
            </button>
          ))}

          <div className="assistant-disclaimer">
            <span className="material-symbols-rounded">
              lightbulb
            </span>

            <small>
              Voice chat uses your browser’s built-in speech
              tools. AI answers are enabled when the school
              configures its provider key.
            </small>
          </div>

        </aside>

      </div>
    </>
  );
}


// =====================================================
// VIDEO COMPONENTS
// =====================================================

function RemoteVideo({ stream, name }) {
  const video = useRef(null);

  useEffect(() => {
    if (video.current) {
      video.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-tile remote-tile">
      <video ref={video} autoPlay playsInline />
      <span className="video-name">{name}</span>
    </div>
  );
}


// =====================================================
// WEBRTC VIDEO ROOM
// =====================================================

function VideoRoom({
  code,
  user,
  token,
  onClose,
  setError,
}) {
  const localRef = useRef(null);
  const pcs = useRef(new Map());
  const ice = useRef(new Map());
  const socket = useRef(null);

  const [remotes, setRemotes] = useState([]);
  const [status, setStatus] = useState(
    'Connecting to the video room…'
  );

  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [retry, setRetry] = useState(0);
  const [mediaIssue, setMediaIssue] = useState(false);

  useEffect(() => {
    let stream;
    let alive = true;

    const start = async () => {
      try {
        if (
          !window.isSecureContext ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw Object.assign(
            new Error(
              'Camera and microphone access needs a current browser on localhost or HTTPS.'
            ),
            { name: 'MediaUnavailableError' }
          );
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!alive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setMediaIssue(false);

        if (localRef.current) {
          localRef.current.srcObject = stream;
        }

        const wsBase = API
          ? API.replace(/^http/, 'ws')
          : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`;

        const ws = new WebSocket(
          `${wsBase}/ws/meeting/${encodeURIComponent(code)}?token=${encodeURIComponent(token)}`
        );

        socket.current = ws;

        const signal = (to, message) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ ...message, to }));
          }
        };

        const makePeer = (peerId, offerer) => {
          if (pcs.current.has(peerId)) {
            return pcs.current.get(peerId);
          }

          const pc = new RTCPeerConnection({
            iceServers: [
              {
                urls: 'stun:stun.l.google.com:19302',
              },
            ],
          });

          pcs.current.set(peerId, pc);

          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
          });

          pc.ontrack = (e) => {
            setRemotes((list) =>
              list.some((x) => x.id === peerId)
                ? list.map((x) =>
                    x.id === peerId
                      ? { ...x, stream: e.streams[0] }
                      : x
                  )
                : [
                    ...list,
                    {
                      id: peerId,
                      stream: e.streams[0],
                      name: `Participant ${pcs.current.size}`,
                    },
                  ]
            );

            setStatus('Participants connected');
          };

          pc.onicecandidate = (e) => {
            if (e.candidate) {
              signal(peerId, {
                type: 'ice',
                candidate: e.candidate,
              });
            }
          };

          pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed') {
              setStatus(
                'Call connection failed. Try joining again.'
              );
            }
          };

          if (offerer) {
            pc.createOffer()
              .then((offer) =>
                pc.setLocalDescription(offer)
                  .then(() =>
                    signal(peerId, {
                      type: 'offer',
                      sdp: offer,
                    })
                  )
              )
              .catch(console.warn);
          }

          return pc;
        };

        ws.onopen = () => {
          setStatus(
            'Room connected · waiting for participants'
          );
        };

        ws.onmessage = async (ev) => {
          const msg = JSON.parse(ev.data);

          try {
            if (msg.type === 'joined') {
              msg.peers.forEach((id) => {
                makePeer(id, true);
              });

              if (msg.peers.length === 0) {
                setStatus(
                  'You are the first person here. Share the room code to begin.'
                );
              }
            } else if (msg.type === 'offer') {
              const pc = makePeer(msg.from, false);

              await pc.setRemoteDescription(msg.sdp);

              for (
                const candidate of ice.current.get(msg.from) || []
              ) {
                await pc.addIceCandidate(candidate);
              }

              ice.current.delete(msg.from);

              const answer = await pc.createAnswer();

              await pc.setLocalDescription(answer);

              signal(msg.from, {
                type: 'answer',
                sdp: answer,
              });
            } else if (msg.type === 'answer') {
              const pc = pcs.current.get(msg.from);

              if (pc) {
                await pc.setRemoteDescription(msg.sdp);

                for (
                  const candidate of ice.current.get(msg.from) || []
                ) {
                  await pc.addIceCandidate(candidate);
                }

                ice.current.delete(msg.from);
              }
            } else if (msg.type === 'ice') {
              const pc = pcs.current.get(msg.from);

              const candidate = new RTCIceCandidate(
                msg.candidate
              );

              if (pc?.remoteDescription) {
                await pc.addIceCandidate(candidate);
              } else {
                ice.current.set(msg.from, [
                  ...(ice.current.get(msg.from) || []),
                  candidate,
                ]);
              }
            } else if (msg.type === 'peer-left') {
              pcs.current.get(msg.id)?.close();
              pcs.current.delete(msg.id);
              ice.current.delete(msg.id);

              setRemotes((list) =>
                list.filter((x) => x.id !== msg.id)
              );

              setStatus('A participant left the room');
            }
          } catch (e) {
            console.warn('WebRTC signaling issue', e);
          }
        };

        ws.onerror = () => {
          setStatus(
            'Could not connect to the room signaling service.'
          );
        };

        ws.onclose = () => {
          if (alive) {
            setStatus('Video room connection closed.');
          }
        };

      } catch (e) {
        if (!alive) return;

        setMediaIssue(true);

        if (
          e.name === 'NotAllowedError' ||
          e.name === 'PermissionDeniedError'
        ) {
          setStatus(
            'Camera or microphone permission was dismissed or blocked. Allow access in browser site settings, then try again.'
          );
        } else if (
          e.name === 'NotFoundError' ||
          e.name === 'DevicesNotFoundError'
        ) {
          setStatus(
            'No camera or microphone was found. Connect a device, then try again.'
          );
        } else {
          setStatus(
            e.message ||
            'Could not start the camera and microphone. Check browser permissions, then try again.'
          );
        }
      }
    };

    start();

    return () => {
      alive = false;

      socket.current?.close();

      pcs.current.forEach((pc) => pc.close());
      pcs.current.clear();

      stream?.getTracks().forEach((track) => track.stop());
    };

  }, [code, token, retry, setError]);

  const toggleTrack = (kind) => {
    const track = localRef.current
      ?.srcObject
      ?.getTracks()
      .find((t) => t.kind === kind);

    if (track) {
      track.enabled = !track.enabled;

      if (kind === 'audio') {
        setMuted(!track.enabled);
      } else {
        setCameraOff(!track.enabled);
      }
    }
  };

  const screen = async () => {
    try {
      const display =
        await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

      const track = display.getVideoTracks()[0];

      const senders = [...pcs.current.values()]
        .map((pc) =>
          pc.getSenders().find(
            (s) => s.track?.kind === 'video'
          )
        )
        .filter(Boolean);

      for (const sender of senders) {
        await sender.replaceTrack(track);
      }

      setSharing(true);

      track.onended = async () => {
        const cam = localRef.current
          ?.srcObject
          ?.getVideoTracks()[0];

        for (const sender of senders) {
          if (cam) {
            await sender.replaceTrack(cam);
          }
        }

        setSharing(false);
      };

    } catch (e) {
      if (e.name !== 'NotAllowedError') {
        setError(e.message);
      }
    }
  };

  return (
    <div className="video-overlay">

      <div className="video-shell">

        <header className="video-header">

          <div>
            <span className="live-dot" />
            Campus Commons
            <span className="video-room-name">
              · {user.name}’s room
            </span>
          </div>

          <div className="room-code">
            Room code <b>{code}</b>

            <button
              onClick={() =>
                navigator.clipboard?.writeText(code)
              }
            >
              Copy
            </button>
          </div>

          <button
            className="video-close"
            onClick={onClose}
            aria-label="Leave call"
          >
            ×
          </button>

        </header>

        <div className="video-stage">

          <div className="video-tile local-tile">
            <video
              ref={localRef}
              autoPlay
              playsInline
              muted
            />
            <span className="video-name">
              {user.name} (you)
            </span>
          </div>

          {remotes.map((r) =>
            r.stream && (
              <RemoteVideo
                key={r.id}
                stream={r.stream}
                name={r.name}
              />
            )
          )}

        </div>

        <div className="video-controls">

          <button
            onClick={() => toggleTrack('audio')}
            className={muted ? 'control-off' : ''}
          >
            <span className="material-symbols-rounded">
              {muted ? 'mic_off' : 'mic'}
            </span>
            <small>{muted ? 'Unmute' : 'Mute'}</small>
          </button>

          <button
            onClick={() => toggleTrack('video')}
            className={cameraOff ? 'control-off' : ''}
          >
            <span className="material-symbols-rounded">
              {cameraOff ? 'videocam_off' : 'videocam'}
            </span>
            <small>
              {cameraOff ? 'Start camera' : 'Camera'}
            </small>
          </button>

          <button
            onClick={screen}
            className={sharing ? 'control-on' : ''}
          >
            <span className="material-symbols-rounded">
              present_to_all
            </span>
            <small>
              {sharing ? 'Sharing' : 'Share screen'}
            </small>
          </button>

          <button
            className="leave-control"
            onClick={onClose}
          >
            <span className="material-symbols-rounded">
              call_end
            </span>
            <small>Leave call</small>
          </button>

        </div>

        <div className="video-status">
          {status}

          {mediaIssue && (
            <>
              {' '}
              <button
                onClick={() =>
                  setRetry((value) => value + 1)
                }
              >
                Try again
              </button>
            </>
          )}

          <span>·</span>
          Peer-to-peer encrypted transport
        </div>

      </div>
    </div>
  );
}

export default App;
