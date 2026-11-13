
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  Filter,
  LogOut,
  Menu,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Users,
  X,
  Eye,
  TrendingUp,
  Clock,
  Hotel,
  AlertCircle
} from 'lucide-react';
import { supabase } from './lib/supabase';

const formatDate = (value) => {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatDateTime = (value) => {
  if (!value) return '—';

  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const average = (rows) => {
  if (!rows.length) return '0.0';

  return (
    rows.reduce((sum, row) => sum + Number(row.rating || 0), 0) /
    rows.length
  ).toFixed(1);
};

const getRatingType = (rating) => {
  if (rating >= 8) return 'positive';
  if (rating >= 6) return 'fair';
  return 'poor';
};

const getNpsType = (rating) => {
  if (rating === null || rating === undefined || rating === '') return 'Unclassified';
  const score = Number(rating);
  if (score >= 9 && score <= 10) return 'Promoter';
  if (score >= 7 && score <= 8) return 'Passive';
  if (score >= 0 && score <= 6) return 'Detractor';
  return 'Unclassified';
};

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();

    setLoading(true);
    setError('');

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
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
    <>
      <style>{styles}</style>

      <main className="rv-login-page">
        <div className="login-decoration login-decoration-one" />
        <div className="login-decoration login-decoration-two" />

        <section className="rv-login-card">
          <div className="login-logo">
            <Hotel size={32} />
          </div>

          <p className="rv-eyebrow">RIFT VALLEY HOTEL • ADAMA</p>

          <h1>Feedback Intelligence</h1>

          <p className="login-description">
            Management portal. Secure access for authorized hotel staff.
          </p>

          <form onSubmit={submit} className="rv-login-form">
            <label>Email address</label>

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your staff email"
              autoComplete="username"
              required
            />

            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />

            {error && (
              <div className="rv-error">
                <AlertCircle size={17} />
                {error}
              </div>
            )}

            <button
              className="rv-primary-button login-submit"
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <>
                  <RefreshCw size={17} className="rv-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in securely'
              )}
            </button>
          </form>

          <div className="login-security">
            <ShieldCheck size={18} />
            Protected management access
          </div>

          <p className="login-footer">
            Rift Valley Hotel • Guest Experience Management
          </p>
        </section>
      </main>
    </>
  );
}

function Admin() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selected, setSelected] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const { data, error: sessionError } =
        await supabase.auth.getSession();

      if (!mounted) return;

      if (sessionError) {
        setError(sessionError.message);
        setLoading(false);
        return;
      }

      if (data.session?.user) {
        await loadProfile(data.session.user);
      } else {
        setLoading(false);
      }
    }

    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !session?.user) {
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
      setFeedback([]);
      setError(
        'This account is not authorized to access the management portal.'
      );
      setLoading(false);
      return;
    }

    setUser(authUser);
    setProfile(staff);

    await loadFeedback();
  }

  async function loadFeedback() {
    setRefreshing(true);
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
    setRefreshing(false);
  }

  async function logout() {
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
      return;
    }

    setUser(null);
    setProfile(null);
    setFeedback([]);
    setSelected(null);
    setMobileMenu(false);
  }

  const filtered = useMemo(() => {
    return feedback.filter(row => {
      const text = [
        row.room_number,
        row.meeting_hall,
        row.comments,
        row.source_location,
        ...(row.service_tags || [])
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesRating =
        ratingFilter === 'all' ||
        (ratingFilter === 'positive' && row.rating >= 8) ||
        (ratingFilter === 'fair' && row.rating >= 6 && row.rating <= 7) ||
        (ratingFilter === 'poor' && row.rating <= 5) ||
        (ratingFilter === 'nps-promoters' && getNpsType(row.rating) === 'Promoter') ||
        (ratingFilter === 'nps-passives' && getNpsType(row.rating) === 'Passive') ||
        (ratingFilter === 'nps-detractors' && getNpsType(row.rating) === 'Detractor');

      const day = row.feedback_date || row.created_at?.slice(0, 10);

      const matchesStart = !startDate || day >= startDate;
      const matchesEnd = !endDate || day <= endDate;

      return (
        matchesSearch &&
        matchesRating &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [feedback, search, ratingFilter, startDate, endDate]);

  const scoreAverage = average(filtered);

  const promoters = filtered.filter(row => row.rating >= 8).length;
  const fairRatings = filtered.filter(
    row => row.rating >= 6 && row.rating <= 7
  ).length;
  const poorRatings = filtered.filter(row => row.rating <= 5).length;

  // Standard NPS groups: detractors 0–6, passives 7–8, promoters 9–10.
  const npsPromoters = filtered.filter(row => getNpsType(row.rating) === 'Promoter').length;
  const npsPassives = filtered.filter(row => getNpsType(row.rating) === 'Passive').length;
  const npsDetractors = filtered.filter(row => getNpsType(row.rating) === 'Detractor').length;
  const npsResponses = npsPromoters + npsPassives + npsDetractors;
  const npsScore = npsResponses
    ? Math.round(((npsPromoters - npsDetractors) / npsResponses) * 100)
    : null;

  const satisfaction = filtered.length
    ? Math.round((promoters / filtered.length) * 100)
    : 0;

  const ratingCounts = Array.from({ length: 11 }, (_, rating) => ({
    rating,
    count: filtered.filter(
      row => Number(row.rating) === rating
    ).length
  }));

  const maximumCount = Math.max(
    ...ratingCounts.map(item => item.count),
    1
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );

  const paginatedFeedback = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search, ratingFilter, startDate, endDate]);

  function clearFilters() {
    setSearch('');
    setRatingFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  }

  function exportCSV() {
    if (!filtered.length) {
      setError('There are no feedback records to export.');
      return;
    }

    const headers = [
      'Feedback Date',
      'Submission Date',
      'Room Number',
      'Meeting Hall',
      'Rating',
      'NPS Group',
      'Comments',
      'Service Tags',
      'Source'
    ];

    const rows = filtered.map(row => [
      row.feedback_date || '',
      row.created_at || '',
      row.room_number || '',
      row.meeting_hall || '',
      row.rating,
      getNpsType(row.rating),
      row.comments || '',
      (row.service_tags || []).join('; '),
      row.source_location || ''
    ]);

    const csv = [headers, ...rows]
      .map(row =>
        row
          .map(value =>
            `"${String(value ?? '').replaceAll('"', '""')}"`
          )
          .join(',')
      )
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download =
      `Rift-Valley-Feedback-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <>
        <style>{styles}</style>

        <div className="rv-loading-screen">
          <div className="loading-logo">
            <Hotel size={30} />
          </div>

          <RefreshCw size={22} className="rv-spin" />

          <strong>Preparing your dashboard</strong>
          <span>Rift Valley Hotel • Management Portal</span>
        </div>
      </>
    );
  }

  if (!user || !profile) {
    return (
      <Login
        onLogin={loadProfile}
      />
    );
  }

  return (
    <>
      <style>{styles}</style>

      <div className="rv-dashboard">

        {mobileMenu && (
          <button
            className="rv-mobile-overlay"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          />
        )}

        <aside className={`rv-sidebar ${mobileMenu ? 'mobile-open' : ''}`}>
          <div className="rv-brand">
            <div className="rv-brand-icon">
              <Hotel size={25} />
            </div>

            <div>
              <strong>RIFT VALLEY</strong>
              <span>HOTEL • ADAMA</span>
            </div>

            <button
              className="rv-mobile-close"
              onClick={() => setMobileMenu(false)}
              aria-label="Close menu"
            >
              <X size={21} />
            </button>
          </div>

          <div className="rv-sidebar-label">MANAGEMENT</div>

          <div className="rv-nav-item active">
            <BarChart3 size={19} />
            <span>Overview</span>
          </div>

          <div
            className="rv-nav-item"
            onClick={() => {
              document
                .getElementById('feedback-records')
                ?.scrollIntoView({ behavior: 'smooth' });

              setMobileMenu(false);
            }}
          >
            <MessageSquare size={19} />
            <span>Guest feedback</span>
          </div>

          <div
            className="rv-nav-item"
            onClick={() => {
              document
                .getElementById('rating-insights')
                ?.scrollIntoView({ behavior: 'smooth' });

              setMobileMenu(false);
            }}
          >
            <Activity size={19} />
            <span>Rating insights</span>
          </div>

          <div className="rv-sidebar-spacer" />

          <div className="rv-sidebar-help">
            <ShieldCheck size={20} />

            <div>
              <strong>Secure workspace</strong>
              <span>Authorized staff access</span>
            </div>
          </div>

          <div className="rv-staff-card">
            <div className="rv-staff-avatar">
              {(profile.full_name || 'S').charAt(0).toUpperCase()}
            </div>

            <div className="rv-staff-info">
              <strong>{profile.full_name}</strong>
              <span>{profile.role}</span>
            </div>
          </div>

          <button
            className="rv-logout-button"
            onClick={logout}
            type="button"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>

          <div className="rv-sidebar-footer">
            RIFT VALLEY HOTEL © {new Date().getFullYear()}
          </div>
        </aside>

        <main className="rv-main">

          <header className="rv-topbar">
            <div className="rv-topbar-left">
              <button
                className="rv-menu-button"
                onClick={() => setMobileMenu(true)}
                aria-label="Open menu"
              >
                <Menu size={23} />
              </button>

              <div>
                <p className="rv-eyebrow">
                  GUEST EXPERIENCE MANAGEMENT
                </p>

                <h1>Feedback dashboard</h1>
              </div>
            </div>

            <div className="rv-topbar-actions">
              <div className="rv-user-chip">
                <span className="rv-online-dot" />
                <span>Management access</span>
              </div>

              <button
                className="rv-icon-button"
                onClick={loadFeedback}
                disabled={refreshing}
                title="Refresh feedback"
              >
                <RefreshCw
                  size={18}
                  className={refreshing ? 'rv-spin' : ''}
                />
              </button>

              <button
                className="rv-top-logout"
                onClick={logout}
                type="button"
              >
                <LogOut size={17} />
                Sign out
              </button>
            </div>
          </header>

          <div className="rv-content">

            <section className="rv-welcome">
              <div>
                <span className="rv-welcome-label">
                  MANAGEMENT OVERVIEW
                </span>

          <h2>
  Welcome back.
</h2>

                <p>
                  Monitor guest experiences and understand hotel service performance.
                </p>
              </div>

              <div className="rv-date-card">
                <CalendarDays size={20} />

                <div>
                  <span>TODAY</span>
                  <strong>
                    {new Date().toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </strong>
                </div>
              </div>
            </section>

            {error && (
              <div className="rv-error rv-dashboard-error">
                <AlertCircle size={18} />
                <span>{error}</span>

                <button
                  onClick={() => setError('')}
                  aria-label="Dismiss error"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            <section className="rv-section-heading">
              <div>
                <h2>Performance overview</h2>
                <p>Summary of guest feedback submissions.</p>
              </div>

              <button
                className="rv-outline-button"
                onClick={loadFeedback}
                disabled={refreshing}
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? 'rv-spin' : ''}
                />
                Refresh data
              </button>
            </section>

            <section className="rv-stats-grid">
              <Stat
                icon={<MessageSquare />}
                label="Total feedback"
                value={filtered.length}
                detail="Matching records"
                color="blue"
              />

              <Stat
                icon={<Star />}
                label="Average rating"
                value={`${scoreAverage}/10`}
                detail="Out of ten points"
                color="gold"
              />

              <Stat
                icon={<CheckCircle2 />}
                label="Guest satisfaction"
                value={`${satisfaction}%`}
                detail="Ratings of 8–10"
                color="green"
              />

              <Stat
                icon={<Users />}
                label="All submissions"
                value={feedback.length}
                detail="Across all dates"
                color="purple"
              />

              <Stat
                icon={<TrendingUp />}
                label="Net Promoter Score"
                value={npsScore === null ? '—' : npsScore > 0 ? `+${npsScore}` : npsScore}
                detail="Promoters % minus detractors %"
                color="green"
              />
            </section>

            <section className="rv-section-heading" id="rating-insights">
              <div>
                <h2>Guest experience insights</h2>
                <p>Understand how guests rate their hotel experience.</p>
              </div>
            </section>

            <section className="rv-insights-grid">

              <div className="rv-panel rv-rating-panel">
                <div className="rv-panel-heading">
                  <div>
                    <h3>Rating distribution</h3>
                    <p>Number of guest ratings from 0 to 10</p>
                  </div>

                  <div className="rv-panel-icon">
                    <BarChart3 size={21} />
                  </div>
                </div>

                <div className="rv-chart">
                  {ratingCounts.map(item => (
                    <div className="rv-bar-column" key={item.rating}>
                      <span className="rv-bar-count">
                        {item.count || ''}
                      </span>

                      <div className="rv-bar-track">
                        <div
                          className={`rv-bar-fill ${
                            item.rating <= 5
                              ? 'low'
                              : item.rating <= 7
                                ? 'mid'
                                : 'high'
                          }`}
                          style={{
                            height: `${
                              filtered.length
                                ? Math.max(
                                    3,
                                    (item.count / maximumCount) * 100
                                  )
                                : 3
                            }%`
                          }}
                        />
                      </div>

                      <span className="rv-bar-label">
                        {item.rating}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rv-chart-legend">
                  <span>
                    <i className="rv-dot low" />
                    0–5 Needs improvement
                  </span>

                  <span>
                    <i className="rv-dot mid" />
                    6–7 Fair
                  </span>

                  <span>
                    <i className="rv-dot high" />
                    8–10 Positive
                  </span>
                </div>
              </div>

              <div className="rv-panel rv-satisfaction-panel">
                <div className="rv-panel-heading">
                  <div>
                    <h3>Guest satisfaction</h3>
                    <p>Positive guest ratings</p>
                  </div>

                  <div className="rv-panel-icon">
                    <TrendingUp size={21} />
                  </div>
                </div>

                <div className="rv-satisfaction-number">
                  {satisfaction}
                  <small>%</small>
                </div>

                <div className="rv-progress-track">
                  <div
                    className="rv-progress-fill"
                    style={{ width: `${satisfaction}%` }}
                  />
                </div>

                <p className="rv-satisfaction-description">
                  {promoters} positive ratings out of {filtered.length} matching submissions.
                </p>

                <div className="rv-rating-summary">
                  <div>
                    <span className="rv-summary-dot positive" />
                    <span>Positive</span>
                    <strong>{promoters}</strong>
                  </div>

                  <div>
                    <span className="rv-summary-dot fair" />
                    <span>Fair</span>
                    <strong>{fairRatings}</strong>
                  </div>

                  <div>
                    <span className="rv-summary-dot poor" />
                    <span>Needs improvement</span>
                    <strong>{poorRatings}</strong>
                  </div>
                </div>
              </div>

              <div className="rv-panel rv-nps-panel">
                <div className="rv-panel-heading">
                  <div>
                    <h3>Net Promoter Score (NPS)</h3>
                    <p>How likely guests are to recommend the hotel</p>
                  </div>
                  <div className="rv-panel-icon">
                    <TrendingUp size={21} />
                  </div>
                </div>

                <div className="rv-nps-value">
                  {npsScore === null ? '—' : npsScore > 0 ? `+${npsScore}` : npsScore}
                  <small>/ 100</small>
                </div>
                <p className="rv-nps-formula">NPS = % Promoters − % Detractors</p>

                <div className="rv-nps-breakdown">
                  <div>
                    <span><i className="rv-nps-dot promoter" />Promoters <small>(9–10)</small></span>
                    <strong>{npsPromoters}</strong>
                  </div>
                  <div>
                    <span><i className="rv-nps-dot passive" />Passives <small>(7–8)</small></span>
                    <strong>{npsPassives}</strong>
                  </div>
                  <div>
                    <span><i className="rv-nps-dot detractor" />Detractors <small>(0–6)</small></span>
                    <strong>{npsDetractors}</strong>
                  </div>
                </div>
                <p className="rv-nps-note">
                  Based on {npsResponses} valid NPS {npsResponses === 1 ? 'response' : 'responses'} matching the current filters.
                </p>
              </div>

            </section>

            <section className="rv-panel rv-feedback-panel" id="feedback-records">

              <div className="rv-records-heading">
                <div>
                  <div className="rv-record-title">
                    <MessageSquare size={21} />
                    <h2>Guest feedback records</h2>
                  </div>

                  <p>Search, filter and review guest submissions.</p>
                </div>

                <button
                  className="rv-primary-button rv-export-button"
                  onClick={exportCSV}
                >
                  <Download size={17} />
                  Export CSV
                </button>
              </div>

              <div className="rv-filters">

                <div className="rv-search-box">
                  <Search size={18} />

                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search comments, room, service..."
                  />

                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      aria-label="Clear search"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <select
                  value={ratingFilter}
                  onChange={e => setRatingFilter(e.target.value)}
                >
                  <option value="all">All ratings</option>
                  <option value="positive">Positive (8–10)</option>
                  <option value="fair">Fair (6–7)</option>
                  <option value="poor">Needs improvement (0–5)</option>
                  <option value="nps-promoters">NPS Promoters (9–10)</option>
                  <option value="nps-passives">NPS Passives (7–8)</option>
                  <option value="nps-detractors">NPS Detractors (0–6)</option>
                </select>

                <label className="rv-date-filter">
                  <CalendarDays size={16} />

                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    title="Start date"
                  />
                </label>

                <label className="rv-date-filter">
                  <CalendarDays size={16} />

                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    title="End date"
                  />
                </label>

                <button
                  className="rv-clear-button"
                  onClick={clearFilters}
                >
                  <Filter size={15} />
                  Clear
                </button>

              </div>

              <div className="rv-table-information">
                <span>
                  Showing <strong>{paginatedFeedback.length}</strong> of{' '}
                  <strong>{filtered.length}</strong> records
                </span>

                <span>
                  <Clock size={15} />
                  Latest submissions first
                </span>
              </div>

              <div className="rv-table-wrap">
                <table className="rv-table">
                  <thead>
                    <tr>
                      <th>DATE</th>
                      <th>ROOM</th>
                      <th>MEETING HALL</th>
                      <th>RATING</th>
                      <th>NPS GROUP</th>
                      <th>COMMENTS</th>
                      <th>SERVICE TAGS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedFeedback.map(row => (
                      <tr key={row.id}>
                        <td className="rv-date-cell">
                          {formatDate(row.feedback_date || row.created_at)}
                        </td>

                        <td>{row.room_number || '—'}</td>

                        <td>{row.meeting_hall || '—'}</td>

                        <td>
                          <span
                            className={`rv-rating-pill ${getRatingType(
                              Number(row.rating)
                            )}`}
                          >
                            <Star size={13} />
                            {row.rating}/10
                          </span>
                        </td>

                        <td>
                          <span className={`rv-nps-badge ${getNpsType(row.rating).toLowerCase()}`}>
                            {getNpsType(row.rating)}
                          </span>
                        </td>

                        <td className="rv-comment-cell">
                          {row.comments || '—'}
                        </td>

                        <td>
                          <div className="rv-tags">
                            {(row.service_tags || []).length
                              ? row.service_tags.map(tag => (
                                  <span key={tag}>{tag}</span>
                                ))
                              : '—'}
                          </div>
                        </td>

                        <td>
                          <button
                            className="rv-view-button"
                            onClick={() => setSelected(row)}
                          >
                            <Eye size={15} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!paginatedFeedback.length && (
                      <tr>
                        <td colSpan="8">
                          <div className="rv-empty-state">
                            <div>
                              <FileText size={30} />
                            </div>

                            <strong>No feedback records found</strong>

                            <span>
                              Try changing your search or filters.
                            </span>

                            {(search ||
                              ratingFilter !== 'all' ||
                              startDate ||
                              endDate) && (
                              <button
                                className="rv-clear-button"
                                onClick={clearFilters}
                              >
                                Clear filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="rv-pagination">
                <span>
                  Page {page} of {totalPages}
                </span>

                <div>
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(current => current - 1)}
                  >
                    Previous
                  </button>

                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(current => current + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>

            </section>

            <footer className="rv-footer">
              <span>Rift Valley Hotel • Adama</span>

              <span>
                <ShieldCheck size={15} />
                Secure management portal
              </span>
            </footer>

          </div>
        </main>

        {selected && (
          <div
            className="rv-modal-backdrop"
            onClick={() => setSelected(null)}
          >
            <section
              className="rv-detail-modal"
              onClick={e => e.stopPropagation()}
            >
              <div className="rv-modal-heading">
                <div>
                  <p className="rv-eyebrow">SUBMISSION DETAILS</p>
                  <h2>Guest feedback</h2>
                </div>

                <button
                  className="rv-close-button"
                  onClick={() => setSelected(null)}
                  aria-label="Close details"
                >
                  <X size={21} />
                </button>
              </div>

              <div className="rv-modal-rating">
                <Star size={25} />

                <strong>{selected.rating}/10</strong>

                <span>
                  {Number(selected.rating) >= 8
                    ? 'Positive experience'
                    : Number(selected.rating) >= 6
                      ? 'Fair experience'
                      : 'Needs improvement'}
                </span>
              </div>

              <Detail
                label="Feedback date"
                value={formatDate(selected.feedback_date || selected.created_at)}
              />

              <Detail
                label="Submission time"
                value={formatDateTime(selected.created_at)}
              />

              <Detail
                label="Room number"
                value={selected.room_number}
              />

              <Detail
                label="Meeting hall"
                value={selected.meeting_hall}
              />

              <Detail
                label="NPS group"
                value={getNpsType(selected.rating)}
              />

              <Detail
                label="Comments"
                value={selected.comments}
              />

              <Detail
                label="Service tags"
                value={(selected.service_tags || []).join(', ')}
              />

              <Detail
                label="Source"
                value={selected.source_location}
              />

              <button
                className="rv-primary-button rv-modal-close"
                onClick={() => setSelected(null)}
              >
                Close details
              </button>
            </section>
          </div>
        )}

      </div>
    </>
  );
}

function Stat({ icon, label, value, detail, color }) {
  return (
    <div className="rv-stat-card">
      <div className="rv-stat-top">
        <span>{label}</span>

        <div className={`rv-stat-icon ${color}`}>
          {icon}
        </div>
      </div>

      <strong className="rv-stat-value">{value}</strong>

      <small>{detail}</small>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rv-detail-row">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap');

:root {
  --rv-navy: #101e36;
  --rv-navy-light: #192c4b;
  --rv-gold: #c6a15b;
  --rv-gold-light: #f3e8cf;
  --rv-bg: #f5f7fa;
  --rv-white: #ffffff;
  --rv-text: #182338;
  --rv-muted: #788397;
  --rv-border: #e8edf3;
  --rv-green: #16865b;
  --rv-red: #c94c4c;
}

* {
  box-sizing: border-box;
}

.rv-dashboard,
.rv-login-page,
.rv-loading-screen {
  font-family: 'Inter', 'Poppins', sans-serif;
  color: var(--rv-text);
}

.rv-dashboard {
  min-height: 100vh;
  background: var(--rv-bg);
  display: flex;
}

button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: .55;
}

/* LOGIN */

.rv-login-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 15% 15%, rgba(198,161,91,.17), transparent 30%),
    linear-gradient(135deg, #101e36, #1a3151);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 25px;
  position: relative;
  overflow: hidden;
}

.login-decoration {
  position: absolute;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 50%;
  pointer-events: none;
}

.login-decoration-one {
  width: 550px;
  height: 550px;
  top: -280px;
  right: -150px;
}

.login-decoration-two {
  width: 450px;
  height: 450px;
  bottom: -250px;
  left: -100px;
}

.rv-login-card {
  width: 100%;
  max-width: 440px;
  background: white;
  border-radius: 22px;
  padding: 43px;
  box-shadow: 0 30px 90px rgba(0,0,0,.25);
  position: relative;
  z-index: 1;
}

.login-logo {
  width: 66px;
  height: 66px;
  border-radius: 18px;
  background: var(--rv-navy);
  color: var(--rv-gold);
  display: grid;
  place-items: center;
  margin-bottom: 25px;
}

.rv-eyebrow {
  color: var(--rv-gold);
  font-size: 10px;
  letter-spacing: 2px;
  font-weight: 800;
  margin: 0 0 10px;
}

.rv-login-card h1 {
  font-family: 'Poppins', sans-serif;
  font-size: 27px;
  margin: 0;
  color: var(--rv-navy);
}

.login-description {
  color: var(--rv-muted);
  font-size: 13px;
  line-height: 1.7;
  margin: 10px 0 28px;
}

.rv-login-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rv-login-form label {
  font-size: 12px;
  font-weight: 700;
  color: #35435a;
  margin-top: 7px;
}

.rv-login-form input {
  width: 100%;
  padding: 14px;
  border: 1px solid var(--rv-border);
  border-radius: 9px;
  outline: none;
  font-size: 13px;
  background: #fbfcfe;
  color: var(--rv-text);
}

.rv-login-form input:focus {
  border-color: var(--rv-gold);
  box-shadow: 0 0 0 3px rgba(198,161,91,.12);
}

.rv-primary-button {
  background: var(--rv-navy);
  color: white;
  border: 0;
  padding: 12px 17px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  font-size: 12px;
  font-weight: 700;
  transition: .2s ease;
}

.rv-primary-button:hover {
  background: #263e61;
  transform: translateY(-1px);
}

.login-submit {
  width: 100%;
  padding: 15px;
  margin-top: 12px;
}

.login-security {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 25px;
  color: var(--rv-green);
  font-size: 11px;
  font-weight: 700;
}

.login-footer {
  text-align: center;
  color: #a0a9b7;
  font-size: 10px;
  margin: 25px 0 0;
}

/* LOADING */

.rv-loading-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--rv-bg);
  color: var(--rv-navy);
}

.loading-logo {
  width: 65px;
  height: 65px;
  border-radius: 17px;
  background: var(--rv-navy);
  color: var(--rv-gold);
  display: grid;
  place-items: center;
  margin-bottom: 8px;
}

.rv-loading-screen strong {
  font-size: 15px;
}

.rv-loading-screen span {
  color: var(--rv-muted);
  font-size: 11px;
}

.rv-spin {
  animation: rv-spin 1s linear infinite;
}

@keyframes rv-spin {
  to { transform: rotate(360deg); }
}

/* SIDEBAR */

.rv-sidebar {
  width: 255px;
  min-width: 255px;
  background: var(--rv-navy);
  color: white;
  display: flex;
  flex-direction: column;
  padding: 25px 17px 15px;
  min-height: 100vh;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 20;
}

.rv-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px 33px;
  border-bottom: 1px solid rgba(255,255,255,.09);
}

.rv-brand-icon {
  width: 43px;
  height: 43px;
  border-radius: 12px;
  background: rgba(198,161,91,.14);
  color: var(--rv-gold);
  display: grid;
  place-items: center;
}

.rv-brand strong {
  display: block;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  letter-spacing: 1px;
}

.rv-brand span {
  display: block;
  font-size: 9px;
  color: #a9b5c7;
  letter-spacing: 1.6px;
  margin-top: 4px;
}

.rv-sidebar-label {
  color: #8291a8;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.8px;
  padding: 28px 12px 13px;
}

.rv-nav-item {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 13px 14px;
  border-radius: 9px;
  color: #b5c0d0;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
  cursor: pointer;
  transition: .2s ease;
}

.rv-nav-item:hover,
.rv-nav-item.active {
  color: white;
  background: rgba(198,161,91,.15);
}

.rv-nav-item.active {
  border-left: 3px solid var(--rv-gold);
}

.rv-nav-item.active svg {
  color: var(--rv-gold);
}

.rv-sidebar-spacer {
  flex: 1;
  min-height: 20px;
}

.rv-sidebar-help {
  display: flex;
  gap: 11px;
  align-items: center;
  background: rgba(255,255,255,.055);
  padding: 13px 10px;
  border-radius: 10px;
  margin-bottom: 18px;
  color: var(--rv-gold);
}

.rv-sidebar-help strong,
.rv-sidebar-help span {
  display: block;
}

.rv-sidebar-help strong {
  font-size: 10px;
  color: white;
}

.rv-sidebar-help span {
  font-size: 9px;
  color: #aab7c8;
  margin-top: 4px;
}

.rv-staff-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 5px;
  border-top: 1px solid rgba(255,255,255,.1);
}

.rv-staff-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--rv-gold);
  color: var(--rv-navy);
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 14px;
}

.rv-staff-info {
  min-width: 0;
  flex: 1;
}

.rv-staff-info strong,
.rv-staff-info span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rv-staff-info strong {
  color: white;
  font-size: 11px;
}

.rv-staff-info span {
  color: #aab7c8;
  font-size: 10px;
  margin-top: 4px;
  text-transform: capitalize;
}

.rv-logout-button {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(255,255,255,.17);
  background: rgba(255,255,255,.06);
  color: white;
  border-radius: 9px;
  display: flex;
  align-items: center;
  gap: 11px;
  font-size: 12px;
  font-weight: 700;
  transition: .2s ease;
}

.rv-logout-button:hover {
  background: rgba(220,75,75,.2);
  border-color: rgba(255,120,120,.45);
  color: #ffd4d4;
}

.rv-sidebar-footer {
  text-align: center;
  color: #728198;
  font-size: 8px;
  letter-spacing: .8px;
  padding-top: 17px;
}

.rv-mobile-close,
.rv-menu-button,
.rv-mobile-overlay {
  display: none;
}

/* MAIN AREA */

.rv-main {
  flex: 1;
  min-width: 0;
}

.rv-topbar {
  height: 91px;
  background: white;
  border-bottom: 1px solid var(--rv-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 38px;
}

.rv-topbar-left {
  display: flex;
  align-items: center;
  gap: 13px;
}

.rv-topbar h1 {
  font-family: 'Poppins', sans-serif;
  font-size: 20px;
  color: var(--rv-navy);
  margin: 0;
}

.rv-topbar .rv-eyebrow {
  font-size: 9px;
  margin-bottom: 5px;
}

.rv-topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rv-user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #607087;
  font-size: 10px;
  font-weight: 600;
  margin-right: 8px;
}

.rv-online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1aa36b;
  box-shadow: 0 0 0 3px #e4f6ed;
}

.rv-icon-button {
  width: 39px;
  height: 39px;
  border: 1px solid var(--rv-border);
  border-radius: 9px;
  background: white;
  color: var(--rv-navy);
  display: grid;
  place-items: center;
}

.rv-icon-button:hover {
  border-color: var(--rv-gold);
}

.rv-top-logout {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #eadada;
  background: #fffafa;
  color: #a94343;
  border-radius: 9px;
  padding: 10px 13px;
  font-size: 11px;
  font-weight: 700;
}

.rv-top-logout:hover {
  background: #fff0f0;
}

.rv-content {
  padding: 30px 38px 20px;
  max-width: 1700px;
  margin: 0 auto;
}

.rv-welcome {
  background:
    linear-gradient(110deg, rgba(16,30,54,.97), rgba(31,55,87,.94)),
    linear-gradient(90deg, #101e36, #243d60);
  border-radius: 15px;
  padding: 27px 30px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  position: relative;
  overflow: hidden;
  margin-bottom: 30px;
}

.rv-welcome::after {
  content: '';
  position: absolute;
  width: 230px;
  height: 230px;
  border: 1px solid rgba(198,161,91,.22);
  border-radius: 50%;
  right: 15%;
  top: -130px;
}

.rv-welcome-label {
  color: var(--rv-gold);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 2px;
}

.rv-welcome h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 21px;
  margin: 9px 0 6px;
}

.rv-welcome p {
  color: #c0cada;
  font-size: 11px;
  margin: 0;
}

.rv-date-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,.09);
  border: 1px solid rgba(255,255,255,.12);
  padding: 13px 16px;
  border-radius: 10px;
  position: relative;
  z-index: 1;
  white-space: nowrap;
}

.rv-date-card svg {
  color: var(--rv-gold);
}

.rv-date-card span,
.rv-date-card strong {
  display: block;
}

.rv-date-card span {
  font-size: 8px;
  color: #aebbd0;
  letter-spacing: 1px;
  margin-bottom: 5px;
}

.rv-date-card strong {
  font-size: 11px;
  color: white;
}

/* HEADINGS */

.rv-section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin: 26px 0 16px;
}

.rv-section-heading h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 15px;
  margin: 0 0 5px;
  color: var(--rv-navy);
}

.rv-section-heading p {
  margin: 0;
  font-size: 10px;
  color: var(--rv-muted);
}

.rv-outline-button {
  background: white;
  border: 1px solid var(--rv-border);
  border-radius: 8px;
  padding: 10px 13px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--rv-navy);
  font-size: 10px;
  font-weight: 700;
}

.rv-outline-button:hover {
  border-color: var(--rv-gold);
}

/* STAT CARDS */

.rv-stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 15px;
}

.rv-stat-card {
  background: white;
  border: 1px solid var(--rv-border);
  border-radius: 12px;
  padding: 19px;
  min-width: 0;
  box-shadow: 0 3px 12px rgba(21,39,66,.025);
}

.rv-stat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.rv-stat-top > span {
  color: var(--rv-muted);
  font-size: 10px;
  font-weight: 600;
}

.rv-stat-icon {
  width: 35px;
  height: 35px;
  border-radius: 9px;
  display: grid;
  place-items: center;
}

.rv-stat-icon svg {
  width: 18px;
  height: 18px;
}

.rv-stat-icon.blue {
  background: #eaf1ff;
  color: #426ac0;
}

.rv-stat-icon.gold {
  background: #fbf3e4;
  color: #b58a3d;
}

.rv-stat-icon.green {
  background: #e7f6ef;
  color: #18845a;
}

.rv-stat-icon.purple {
  background: #f1edff;
  color: #8063bb;
}

.rv-stat-value {
  display: block;
  font-family: 'Poppins', sans-serif;
  font-size: 27px;
  color: var(--rv-navy);
  margin: 12px 0 4px;
  font-weight: 700;
}

.rv-stat-card small {
  color: #9aa4b3;
  font-size: 9px;
}

/* INSIGHTS */

.rv-insights-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 16px;
}

.rv-nps-panel {
  display: flex;
  flex-direction: column;
}

.rv-nps-value {
  color: var(--rv-navy);
  font-family: 'Poppins', sans-serif;
  font-size: 42px;
  font-weight: 800;
  margin: 20px 0 0;
  line-height: 1.1;
}

.rv-nps-value small {
  color: var(--rv-muted);
  font-size: 12px;
  font-weight: 600;
  margin-left: 5px;
}

.rv-nps-formula,
.rv-nps-note {
  color: var(--rv-muted);
  font-size: 10px;
  line-height: 1.6;
}

.rv-nps-breakdown {
  display: grid;
  gap: 12px;
  margin-top: 15px;
}

.rv-nps-breakdown > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  font-size: 11px;
}

.rv-nps-breakdown > div > span {
  display: flex;
  align-items: center;
  color: #536176;
}

.rv-nps-breakdown small {
  color: var(--rv-muted);
  margin-left: 4px;
}

.rv-nps-breakdown strong {
  color: var(--rv-navy);
  font-size: 13px;
}

.rv-nps-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
}

.rv-nps-dot.promoter { background: #16865b; }
.rv-nps-dot.passive { background: #d6a943; }
.rv-nps-dot.detractor { background: #c94c4c; }

.rv-nps-badge {
  display: inline-flex;
  border-radius: 20px;
  padding: 5px 8px;
  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;
}

.rv-nps-badge.promoter { background: #e7f6ee; color: #16865b; }
.rv-nps-badge.passive { background: #fff5dc; color: #9a741b; }
.rv-nps-badge.detractor { background: #fff0ee; color: #b74444; }
.rv-nps-badge.unclassified { background: #eef1f5; color: #657184; }

.rv-panel {
  background: white;
  border: 1px solid var(--rv-border);
  border-radius: 12px;
  padding: 21px;
  min-width: 0;
  box-shadow: 0 3px 12px rgba(21,39,66,.025);
}

.rv-panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.rv-panel-heading h3 {
  font-family: 'Poppins', sans-serif;
  color: var(--rv-navy);
  font-size: 13px;
  margin: 0 0 5px;
}

.rv-panel-heading p {
  color: var(--rv-muted);
  font-size: 9px;
  margin: 0;
}

.rv-panel-icon {
  width: 37px;
  height: 37px;
  background: #f8f3e9;
  color: #ad8746;
  border-radius: 9px;
  display: grid;
  place-items: center;
}

.rv-chart {
  height: 155px;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 8px;
  padding-top: 20px;
}

.rv-bar-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}

.rv-bar-count {
  font-size: 9px;
  color: #6d788a;
  height: 15px;
  font-weight: 700;
}

.rv-bar-track {
  width: 100%;
  max-width: 25px;
  height: 105px;
  background: #f0f3f7;
  border-radius: 5px 5px 0 0;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.rv-bar-fill {
  width: 100%;
  min-height: 3px;
  border-radius: 5px 5px 0 0;
  transition: height .4s ease;
}

.rv-bar-fill.low {
  background: #d86a6a;
}

.rv-bar-fill.mid {
  background: #d5a34b;
}

.rv-bar-fill.high {
  background: #279a6c;
}

.rv-bar-label {
  font-size: 9px;
  color: #8a95a5;
  padding-top: 7px;
}

.rv-chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 13px;
  margin-top: 16px;
  border-top: 1px solid var(--rv-border);
  padding-top: 13px;
}

.rv-chart-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
  color: #758196;
}

.rv-dot,
.rv-summary-dot {
  width: 7px;
  height: 7px;
  display: inline-block;
  border-radius: 50%;
}

.rv-dot.low,
.rv-summary-dot.poor {
  background: #d86a6a;
}

.rv-dot.mid,
.rv-summary-dot.fair {
  background: #d5a34b;
}

.rv-dot.high,
.rv-summary-dot.positive {
  background: #279a6c;
}

.rv-satisfaction-number {
  color: var(--rv-navy);
  font-family: 'Poppins', sans-serif;
  font-size: 43px;
  font-weight: 700;
  margin: 19px 0 13px;
}

.rv-satisfaction-number small {
  font-size: 19px;
  color: var(--rv-gold);
  margin-left: 3px;
}

.rv-progress-track {
  height: 9px;
  width: 100%;
  background: #edf0f4;
  border-radius: 20px;
  overflow: hidden;
}

.rv-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #b38b45, #d8b775);
  border-radius: 20px;
  transition: width .4s ease;
}

.rv-satisfaction-description {
  color: var(--rv-muted);
  font-size: 10px;
  margin: 11px 0 16px;
}

.rv-rating-summary {
  border-top: 1px solid var(--rv-border);
  padding-top: 13px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rv-rating-summary > div {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: #6e7a8d;
}

.rv-rating-summary strong {
  margin-left: auto;
  color: var(--rv-navy);
}

/* FEEDBACK TABLE */

.rv-feedback-panel {
  margin-top: 27px;
  padding: 0;
  overflow: hidden;
}

.rv-records-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 21px;
  border-bottom: 1px solid var(--rv-border);
}

.rv-record-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--rv-navy);
}

.rv-record-title svg {
  color: var(--rv-gold);
}

.rv-record-title h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  margin: 0;
}

.rv-records-heading p {
  color: var(--rv-muted);
  font-size: 10px;
  margin: 7px 0 0;
}

.rv-export-button {
  white-space: nowrap;
}

.rv-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--rv-border);
}

.rv-search-box {
  min-width: 210px;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--rv-border);
  border-radius: 8px;
  padding: 0 10px;
  height: 37px;
  color: #8d99a9;
}

.rv-search-box input {
  border: 0;
  outline: 0;
  min-width: 0;
  flex: 1;
  font-size: 10px;
  color: var(--rv-text);
  background: transparent;
}

.rv-search-box button {
  border: 0;
  background: transparent;
  color: #7e8998;
  display: grid;
  place-items: center;
}

.rv-filters select {
  height: 37px;
  border: 1px solid var(--rv-border);
  border-radius: 8px;
  padding: 0 10px;
  background: white;
  color: #68758a;
  font-size: 10px;
  outline: none;
}

.rv-date-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 37px;
  padding: 0 9px;
  border: 1px solid var(--rv-border);
  border-radius: 8px;
  color: #8995a5;
}

.rv-date-filter input {
  width: 105px;
  border: 0;
  outline: none;
  font-size: 9px;
  color: #68758a;
  background: transparent;
}

.rv-clear-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--rv-border);
  border-radius: 8px;
  background: white;
  color: #67758a;
  font-size: 10px;
  font-weight: 600;
}

.rv-clear-button:hover {
  border-color: var(--rv-gold);
  color: var(--rv-navy);
}

.rv-table-information {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  color: #8a95a5;
  font-size: 9px;
}

.rv-table-information strong {
  color: var(--rv-navy);
}

.rv-table-information span:last-child {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rv-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.rv-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 850px;
}

.rv-table thead {
  background: #f8f9fb;
}

.rv-table th {
  color: #8792a3;
  font-size: 8px;
  letter-spacing: .8px;
  text-align: left;
  padding: 13px 14px;
  white-space: nowrap;
}

.rv-table td {
  padding: 14px;
  border-top: 1px solid #eff1f5;
  color: #59677c;
  font-size: 10px;
  vertical-align: middle;
}

.rv-table tbody tr:hover {
  background: #fcfcfd;
}

.rv-date-cell {
  white-space: nowrap;
}

.rv-comment-cell {
  max-width: 210px;
  min-width: 150px;
  line-height: 1.6;
}

.rv-rating-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 20px;
  padding: 6px 9px;
  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;
}

.rv-rating-pill.positive {
  background: #e8f6ef;
  color: #18835b;
}

.rv-rating-pill.fair {
  background: #fbf2df;
  color: #a47a2f;
}

.rv-rating-pill.poor {
  background: #fcecec;
  color: #bd4c4c;
}

.rv-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 170px;
}

.rv-tags span {
  background: #f1f4f8;
  color: #67758a;
  padding: 4px 6px;
  border-radius: 5px;
  font-size: 8px;
}

.rv-view-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid #e8edf3;
  background: white;
  color: var(--rv-navy);
  padding: 7px 10px;
  border-radius: 7px;
  font-size: 9px;
  font-weight: 700;
}

.rv-view-button:hover {
  border-color: var(--rv-gold);
  background: #fffdf8;
}

.rv-empty-state {
  min-height: 190px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: #8995a5;
}

.rv-empty-state > div {
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
  background: #f1f4f8;
  color: #8793a5;
  border-radius: 50%;
}

.rv-empty-state strong {
  color: var(--rv-navy);
  font-size: 12px;
}

.rv-empty-state span {
  font-size: 10px;
}

.rv-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-top: 1px solid var(--rv-border);
  color: #8290a3;
  font-size: 10px;
}

.rv-pagination > div {
  display: flex;
  gap: 7px;
}

.rv-pagination button {
  padding: 8px 12px;
  border: 1px solid var(--rv-border);
  border-radius: 7px;
  background: white;
  color: var(--rv-navy);
  font-size: 10px;
  font-weight: 600;
}

.rv-pagination button:disabled {
  color: #aab2bd;
  background: #f7f8fa;
}

/* FOOTER AND ERRORS */

.rv-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 3px 10px;
  color: #929dad;
  font-size: 9px;
}

.rv-footer span:last-child {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rv-footer svg {
  color: var(--rv-green);
}

.rv-error {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px;
  background: #fff0f0;
  color: #a83f3f;
  border: 1px solid #f5d6d6;
  border-radius: 8px;
  font-size: 11px;
}

.rv-dashboard-error {
  margin-bottom: 18px;
}

.rv-dashboard-error button {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: inherit;
  display: grid;
  place-items: center;
}

/* DETAILS MODAL */

.rv-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(9,19,35,.65);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.rv-detail-modal {
  background: white;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 25px 80px rgba(0,0,0,.25);
}

.rv-modal-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}

.rv-modal-heading h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 18px;
  color: var(--rv-navy);
  margin: 0;
}

.rv-close-button {
  border: 0;
  background: #f1f3f6;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #627086;
}

.rv-modal-rating {
  display: flex;
  align-items: center;
  gap: 9px;
  background: #fbf6ec;
  padding: 14px;
  border-radius: 9px;
  margin-bottom: 17px;
  color: #ad8746;
}

.rv-modal-rating strong {
  font-family: 'Poppins', sans-serif;
  font-size: 21px;
  color: var(--rv-navy);
}

.rv-modal-rating span {
  color: #8a7655;
  font-size: 10px;
  margin-left: auto;
}

.rv-detail-row {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 15px;
  padding: 13px 0;
  border-bottom: 1px solid var(--rv-border);
  font-size: 11px;
  line-height: 1.6;
}

.rv-detail-row > span {
  color: #8994a4;
}

.rv-detail-row strong {
  color: var(--rv-navy);
  font-weight: 600;
  overflow-wrap: anywhere;
}

.rv-modal-close {
  width: 100%;
  margin-top: 20px;
  padding: 13px;
}

/* RESPONSIVE */

@media (max-width: 1100px) {
  .rv-content {
    padding: 25px 22px;
  }

  .rv-topbar {
    padding: 0 22px;
  }

  .rv-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rv-insights-grid {
    grid-template-columns: 1fr 1fr;
  }

  .rv-user-chip {
    display: none;
  }
}

@media (max-width: 760px) {
  .rv-sidebar {
    position: fixed;
    left: -280px;
    top: 0;
    bottom: 0;
    height: 100vh;
    transition: left .25s ease;
    box-shadow: 10px 0 40px rgba(0,0,0,.18);
  }

  .rv-sidebar.mobile-open {
    left: 0;
  }

  .rv-mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.45);
    z-index: 19;
    border: 0;
  }

  .rv-mobile-close {
    display: grid;
    place-items: center;
    margin-left: auto;
    background: transparent;
    color: white;
    border: 0;
  }

  .rv-menu-button {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border: 1px solid var(--rv-border);
    background: white;
    color: var(--rv-navy);
    border-radius: 8px;
  }

  .rv-topbar {
    height: 76px;
    padding: 0 15px;
  }

  .rv-topbar h1 {
    font-size: 15px;
  }

  .rv-topbar .rv-eyebrow {
    font-size: 7px;
  }

  .rv-top-logout {
    padding: 9px;
    font-size: 0;
    gap: 0;
  }

  .rv-top-logout svg {
    width: 18px;
    height: 18px;
  }

  .rv-content {
    padding: 17px 13px;
  }

  .rv-welcome {
    padding: 21px;
    align-items: flex-start;
    flex-direction: column;
  }

  .rv-welcome h2 {
    font-size: 18px;
  }

  .rv-date-card {
    width: 100%;
  }

  .rv-stats-grid {
    gap: 9px;
  }

  .rv-stat-card {
    padding: 13px;
  }

  .rv-stat-value {
    font-size: 22px;
  }

  .rv-stat-top > span {
    font-size: 9px;
  }

  .rv-insights-grid {
    grid-template-columns: 1fr;
  }

  .rv-records-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .rv-export-button {
    width: 100%;
  }

  .rv-filters {
    align-items: stretch;
  }

  .rv-search-box {
    flex-basis: 100%;
  }

  .rv-filters select,
  .rv-date-filter {
    flex: 1;
    min-width: 0;
  }

  .rv-date-filter input {
    width: 100%;
    min-width: 0;
  }

  .rv-clear-button {
    justify-content: center;
  }

  .rv-table-information {
    gap: 10px;
    flex-wrap: wrap;
  }

  .rv-footer {
    gap: 10px;
    flex-wrap: wrap;
  }
}

@media (max-width: 430px) {
  .rv-login-card {
    padding: 28px 22px;
  }

  .rv-stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .rv-stat-icon {
    width: 29px;
    height: 29px;
  }

  .rv-stat-icon svg {
    width: 15px;
    height: 15px;
  }

  .rv-stat-value {
    font-size: 20px;
  }

  .rv-section-heading h2 {
    font-size: 13px;
  }

  .rv-outline-button {
    padding: 9px;
    font-size: 9px;
  }

  .rv-detail-modal {
    padding: 19px;
  }

  .rv-detail-row {
    grid-template-columns: 105px 1fr;
  }
}
`;

export default Admin;
