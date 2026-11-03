
import { useEffect, useMemo, useState } from 'react';
import {
  Activity, BarChart3, CalendarDays, CheckCircle2, Download,
  FileText, Filter, LogOut, MessageSquare, RefreshCw,
  Search, ShieldCheck, Star, Users, X
} from 'lucide-react';
import { supabase } from './lib/supabase';
import './index.css';

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
};

const average = (rows) => rows.length
  ? (rows.reduce((sum, row) => sum + Number(row.rating || 0), 0) / rows.length).toFixed(1)
  : '0.0';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    await onLogin(data.user);
    setLoading(false);
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark">RV</div>
        <p className="eyebrow">RIFT VALLEY HOTEL • ADAMA</p>
        <h1>Feedback Intelligence</h1>
        <p className="muted">Management portal — authorized staff only</p>

        <form onSubmit={submit} className="login-form">
          <label>Email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="staff@riftvalleyhotel.com"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          {error && <div className="error-message">{error}</div>}

          <button className="primary-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in securely'}
          </button>
        </form>

        <div className="secure-note">
          <ShieldCheck size={17} />
          Protected management access
        </div>
      </section>
    </main>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const { data } = await supabase.auth.getSession();
      if (mounted && data.session?.user) {
        await loadProfile(data.session.user);
      } else if (mounted) {
        setLoading(false);
      }
    }

    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          await loadProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
          setFeedback([]);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(authUser) {
    setLoading(true);
    setError('');

    const { data: staff, error: profileError } = await supabase
      .from('staff_profiles')
      .select('user_id, full_name, role, is_active')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (profileError || !staff || !staff.is_active) {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setError('This account is not authorized to access the management portal.');
      setLoading(false);
      return;
    }

    setUser(authUser);
    setProfile(staff);
    await loadFeedback();
  }

  async function loadFeedback() {
    setError('');
    const { data, error: fetchError } = await supabase
      .from('customer_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setFeedback(data || []);
    }
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setFeedback([]);
  }

  const filtered = useMemo(() => {
    return feedback.filter(row => {
      const text = [
        row.room_number,
        row.meeting_hall,
        row.comments,
        row.source_location,
        ...(row.service_tags || [])
      ].join(' ').toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesRating = ratingFilter === 'all' ||
        (ratingFilter === 'high' && row.rating >= 8) ||
        (ratingFilter === 'medium' && row.rating >= 6 && row.rating <= 7) ||
        (ratingFilter === 'low' && row.rating <= 5);

      const day = row.feedback_date || row.created_at?.slice(0, 10);
      const matchesStart = !startDate || day >= startDate;
      const matchesEnd = !endDate || day <= endDate;

      return matchesSearch && matchesRating && matchesStart && matchesEnd;
    });
  }, [feedback, search, ratingFilter, startDate, endDate]);

  const scoreAverage = average(filtered);
  const promoters = filtered.filter(r => r.rating >= 8).length;
  const satisfaction = filtered.length
    ? Math.round((promoters / filtered.length) * 100)
    : 0;

  const ratingCounts = Array.from({ length: 11 }, (_, rating) => ({
    rating,
    count: filtered.filter(row => Number(row.rating) === rating).length
  }));

  function exportCSV() {
    const headers = [
      'Date', 'Room Number', 'Meeting Hall', 'Rating',
      'Comments', 'Service Tags', 'Source'
    ];

    const rows = filtered.map(row => [
      row.feedback_date || row.created_at,
      row.room_number,
      row.meeting_hall,
      row.rating,
      row.comments,
      (row.service_tags || []).join('; '),
      row.source_location
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(value =>
        `"${String(value ?? '').replaceAll('"', '""')}"`
      ).join(','))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rift-Valley-Feedback-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="loading-screen"><RefreshCw className="spin" /> Loading portal...</div>;
  }

  if (!user || !profile) {
    return <Login onLogin={loadProfile} />;
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">RV</div>
          <div>
            <strong>RIFT VALLEY</strong>
            <span>HOTEL • ADAMA</span>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <div className="nav-item active"><BarChart3 size={18} /> Overview</div>
        <div className="nav-item"><MessageSquare size={18} /> Guest feedback</div>
        <div className="nav-item"><Activity size={18} /> Service insights</div>

        <div className="sidebar-bottom">
          <div className="staff-box">
            <div className="staff-avatar">{(profile.full_name || 'S').charAt(0)}</div>
            <div className="staff-info">
              <strong>{profile.full_name}</strong>
              <span>{profile.role}</span>
            </div>
          </div>
          <button className="logout-button" onClick={logout}>
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">GUEST EXPERIENCE MANAGEMENT</p>
            <h1>Feedback dashboard</h1>
            <p className="muted">Understand guest satisfaction and improve hotel service.</p>
          </div>
          <div className="top-actions">
            <button className="outline-button" onClick={loadFeedback}>
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="primary-button export-button" onClick={exportCSV}>
              <Download size={17} /> Export CSV
            </button>
          </div>
        </header>

        {error && <div className="error-message">{error}</div>}

        <section className="stats-grid">
          <Stat icon={<MessageSquare />} label="Total feedback" value={filtered.length} detail="Matching records" />
          <Stat icon={<Star />} label="Average rating" value={`${scoreAverage}/10`} detail="Out of ten points" />
          <Stat icon={<CheckCircle2 />} label="Positive ratings" value={`${satisfaction}%`} detail="Ratings of 8–10" />
          <Stat icon={<Users />} label="All submissions" value={feedback.length} detail="Across all dates" />
        </section>

        <section className="content-grid">
          <div className="panel rating-panel">
            <div className="panel-heading">
              <div>
                <h2>Rating distribution</h2>
                <p className="muted">Guest ratings from 0 to 10</p>
              </div>
              <BarChart3 size={21} />
            </div>
            <div className="rating-chart">
              {ratingCounts.map(item => (
                <div className="bar-column" key={item.rating}>
                  <span className="bar-count">{item.count || ''}</span>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${item.rating <= 5 ? 'low' : item.rating <= 7 ? 'mid' : 'high'}`}
                      style={{ height: `${filtered.length ? Math.max(3, item.count / Math.max(...ratingCounts.map(x => x.count), 1) * 100) : 3}%` }}
                    />
                  </div>
                  <span className="bar-label">{item.rating}</span>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <span><i className="dot low" /> 0–5 Needs improvement</span>
              <span><i className="dot mid" /> 6–7 Fair</span>
              <span><i className="dot high" /> 8–10 Positive</span>
            </div>
          </div>

          <div className="panel insight-panel">
            <div className="panel-heading">
              <div>
                <h2>Guest satisfaction</h2>
                <p className="muted">Ratings of 8 to 10</p>
              </div>
              <Activity size={21} />
            </div>
            <div className="satisfaction-number">{satisfaction}<small>%</small></div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${satisfaction}%` }} />
            </div>
            <p className="muted">
              {promoters} positive ratings out of {filtered.length} matching submissions.
            </p>
            <div className="insight-note">
              <Star size={18} />
              <span>Use guest comments and service tags to identify areas for improvement.</span>
            </div>
          </div>
        </section>

        <section className="panel feedback-panel">
          <div className="panel-heading records-heading">
            <div>
              <h2>Guest feedback records</h2>
              <p className="muted">Search, filter and review guest submissions.</p>
            </div>
            <span className="record-count">{filtered.length} records</span>
          </div>

          <div className="filters">
            <div className="search-box">
              <Search size={17} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search comments, room, service..."
              />
              {search && <button onClick={() => setSearch('')}><X size={15} /></button>}
            </div>

            <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}>
              <option value="all">All ratings</option>
              <option value="high">Positive (8–10)</option>
              <option value="medium">Fair (6–7)</option>
              <option value="low">Needs improvement (0–5)</option>
            </select>

            <label className="date-filter">
              <CalendarDays size={16} />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </label>
            <label className="date-filter">
              <CalendarDays size={16} />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </label>
            <button className="clear-button" onClick={() => {
              setSearch('');
              setRatingFilter('all');
              setStartDate('');
              setEndDate('');
            }}>
              <Filter size={15} /> Clear
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Room</th>
                  <th>Meeting hall</th>
                  <th>Rating</th>
                  <th>Comments</th>
                  <th>Service tags</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id}>
                    <td>{formatDate(row.feedback_date || row.created_at)}</td>
                    <td>{row.room_number || '—'}</td>
                    <td>{row.meeting_hall || '—'}</td>
                    <td>
                      <span className={`rating-pill ${row.rating >= 8 ? 'good' : row.rating >= 6 ? 'fair' : 'poor'}`}>
                        <Star size={13} /> {row.rating}/10
                      </span>
                    </td>
                    <td className="comment-cell">{row.comments || '—'}</td>
                    <td>{(row.service_tags || []).join(', ') || '—'}</td>
                    <td><button className="view-button" onClick={() => setSelected(row)}>View</button></td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan="7" className="empty-state">
                    <FileText size={28} />
                    <strong>No feedback records found</strong>
                    <span>Try changing your search or filters.</span>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="dashboard-footer">
          <span>Rift Valley Hotel • Adama</span>
          <span><ShieldCheck size={14} /> Secure management portal</span>
        </footer>
      </main>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <section className="detail-modal" onClick={e => e.stopPropagation()}>
            <div className="panel-heading">
              <div><p className="eyebrow">SUBMISSION DETAILS</p><h2>Guest feedback</h2></div>
              <button className="close-button" onClick={() => setSelected(null)}><X /></button>
            </div>
            <Detail label="Feedback date" value={formatDate(selected.feedback_date || selected.created_at)} />
            <Detail label="Room number" value={selected.room_number} />
            <Detail label="Meeting hall" value={selected.meeting_hall} />
            <Detail label="Rating" value={`${selected.rating}/10`} />
            <Detail label="Comments" value={selected.comments} />
            <Detail label="Service tags" value={(selected.service_tags || []).join(', ')} />
            <Detail label="Source" value={selected.source_location} />
            <button className="primary-button full-button" onClick={() => setSelected(null)}>Close details</button>
          </section>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, detail }) {
  return (
    <div className="stat-card">
      <div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  );
}

export default App;
