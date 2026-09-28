import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquareWarning,
  MoonStar,
  Plus,
  Target,
  ShieldCheck,
  Sparkles,
  SunMedium,
  UserCircle2,
  X,
} from 'lucide-react'
import { supabase } from './lib/supabaseClient'

const mockAssignments = [
  {
    id: 1,
    title: 'React Components Practice',
    course: 'Web Development',
    description: 'Build and refine reusable UI components for a dashboard layout.',
    dueDate: '2026-09-25',
  },
  {
    id: 2,
    title: 'Database Design',
    course: 'Information Systems',
    description: 'Model a normalized data structure and explain key constraints.',
    dueDate: '2026-09-12',
  },
]

const FILTERS = ['all', 'open', 'overdue']

const mockTests = [
  { id: 1, title: 'Frontend Fundamentals', course: 'Web Development', score: '84%', status: 'Completed' },
  { id: 2, title: 'Database Concepts Checkpoint', course: 'Information Systems', score: '72%', status: 'Completed' },
]

const mockCourses = [
  { id: 1, title: 'Web Development', detail: '3 assignments · 2 tests' },
  { id: 2, title: 'Information Systems', detail: '2 assignments · 1 test' },
  { id: 3, title: 'User Experience Design', detail: '4 assignments · 2 tests' },
]

const mockNotifications = [
  { id: 1, title: 'Database Design is overdue', detail: 'Due yesterday', tone: 'alert' },
  { id: 2, title: 'New research assignment posted', detail: 'User Experience Design', tone: 'new' },
  { id: 3, title: 'Frontend Fundamentals was graded', detail: 'Score: 84%', tone: 'done' },
]

const mockResearch = [
  { id: 1, title: 'Accessibility in student portals', type: 'Research assignment', due: 'Due Sep 28' },
  { id: 2, title: 'Usability interview plan', type: 'Test preparation', due: 'Due Oct 02' },
]

const mockMonitoringEvents = [
  { id: 1, student: 'Student 004812735', test: 'Frontend Fundamentals', note: 'Exam screen hidden: possible tab or window switch.', occurredAt: 'Today, 09:42', severity: 'Review' },
  { id: 2, student: 'Student 008145902', test: 'Database Concepts Checkpoint', note: 'Exam screen hidden: possible tab or window switch.', occurredAt: 'Today, 09:18', severity: 'Review' },
  { id: 3, student: 'Student 003719284', test: 'Frontend Fundamentals', note: 'Returned to exam screen after visibility change.', occurredAt: 'Yesterday, 14:07', severity: 'Logged' },
]

const statusForDueDate = (dueDate) => {
  const due = new Date(`${dueDate}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return due >= today ? 'Open' : 'Overdue'
}

const formatDueDate = (value) => {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const featureCards = [
  {
    icon: CheckCircle2,
    title: 'Role-based access',
    description: 'Students see assignments; facilitators publish and manage work securely.',
  },
  {
    icon: Sparkles,
    title: 'Smart organization',
    description: 'Assignments are grouped, filtered, and tracked by due date with clear priorities.',
  },
  {
    icon: MessageCircle,
    title: 'AI help desk',
    description: 'Quick answers for learners who need guidance without leaving the portal.',
  },
]

const studentEmailPattern = /^\d{9}@([a-z0-9-]+\.)+(ac\.za|edu\.za)$/i
const facilitatorEmailPattern = /^[a-z](?:\.?[a-z]+)@([a-z0-9-]+\.)+(ac\.za|edu\.za)$/i

const classifyInstitutionEmail = (value) => {
  const normalized = value.trim().toLowerCase()

  if (studentEmailPattern.test(normalized)) return 'student'
  if (facilitatorEmailPattern.test(normalized)) return 'facilitator'
  return null
}

const isValidName = (value) => /^[a-z][a-z' -]*$/i.test(value.trim())

function App() {
  const [screen, setScreen] = useState('landing')
  const [menuOpen, setMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [theme, setTheme] = useState('light')
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [workspaceView, setWorkspaceView] = useState('assignments')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [activeTest, setActiveTest] = useState(null)
  const [monitoringEvents, setMonitoringEvents] = useState(mockMonitoringEvents)
  const [filter, setFilter] = useState('all')
  const [assignments, setAssignments] = useState(mockAssignments)
  const [statusMessage, setStatusMessage] = useState('')
  const [authMode, setAuthMode] = useState('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [surname, setSurname] = useState('')
  const [demoRole, setDemoRole] = useState('student')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('2026-09-30')
  const [authVisible, setAuthVisible] = useState(false)
  const [authSubmitting, setAuthSubmitting] = useState(false)

  const effectiveRole = profile?.role || demoRole
  const isFacilitator = effectiveRole === 'facilitator'
  const fullName = [firstName, middleName, surname].filter(Boolean).join(' ')

  const clearAuthDetails = () => {
    setEmail('')
    setPassword('')
    setFirstName('')
    setMiddleName('')
    setSurname('')
  }

  useEffect(() => {
    if (isFacilitator) setWorkspaceView('home')
  }, [isFacilitator])

  const visibleAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const currentStatus = statusForDueDate(assignment.due_date || assignment.dueDate)
      if (filter === 'open') return currentStatus === 'Open'
      if (filter === 'overdue') return currentStatus === 'Overdue'
      return true
    })
  }, [assignments, filter])

  const fetchAssignments = async () => {
    if (!supabase) {
      setAssignments(mockAssignments)
      return
    }

    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .order('due_date', { ascending: false })

    if (!error) {
      setAssignments(data ?? [])
    }
  }

  const fetchMonitoringEvents = async () => {
    if (!supabase) {
      setMonitoringEvents(mockMonitoringEvents)
      return
    }

    const { data, error } = await supabase
      .from('exam_events')
      .select('id, student_id, test_title, note, occurred_at, severity')
      .order('occurred_at', { ascending: false })
      .limit(25)

    if (!error && data?.length) {
      const studentIds = [...new Set(data.map((event) => event.student_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, surname')
        .in('id', studentIds)
      const studentNames = Object.fromEntries((profiles ?? []).map((student) => [
        student.id,
        student.full_name || [student.first_name, student.surname].filter(Boolean).join(' ') || student.id,
      ]))

      setMonitoringEvents(data.map((event) => ({
        ...event,
        student: studentNames[event.student_id] || event.student_id,
        test: event.test_title,
        occurredAt: new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.occurred_at)),
      })))
    }
  }

  const fetchProfile = async (user) => {
    if (!supabase || !user) {
      setProfile({ role: demoRole, full_name: fullName })
      return
    }

    const metadata = user.user_metadata || {}
    const metadataName = [metadata.first_name, metadata.middle_name, metadata.surname]
      .filter(Boolean)
      .join(' ')
      .trim() || metadata.full_name

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!error && data) {
      setProfile({
        ...data,
        full_name: metadataName || data.full_name || user.email.split('@')[0],
        first_name: data.first_name || metadata.first_name || '',
        middle_name: data.middle_name || metadata.middle_name || '',
        surname: data.surname || metadata.surname || '',
      })
    } else {
      setProfile({ role: 'student', full_name: metadataName || user.email.split('@')[0] })
    }
  }

  useEffect(() => {
    if (!supabase) {
      setProfile({ role: demoRole, full_name: fullName })
      return undefined
    }

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      await fetchProfile(data.session?.user ?? null)
      await fetchAssignments()
      await fetchMonitoringEvents()
    }

    loadSession()

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)
      await fetchProfile(nextSession?.user ?? null)
      await fetchAssignments()
      await fetchMonitoringEvents()
    })

    return () => subscription.subscription.unsubscribe()
  }, [demoRole, fullName])

  useEffect(() => {
    if (!activeTest) return undefined

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'hidden') return

      const event = {
        id: Date.now(),
        student: session?.user?.email || 'Current student',
        test: activeTest.title,
        note: 'Exam screen hidden: possible tab or window switch.',
        occurredAt: 'Just now',
        severity: 'Review',
      }

      setMonitoringEvents((current) => [event, ...current])

      if (supabase && session?.user) {
        await supabase.from('exam_events').insert({
          student_id: session.user.id,
          test_title: activeTest.title,
          event_type: 'visibility_hidden',
          note: event.note,
          severity: 'Review',
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [activeTest, session])

  useEffect(() => {
    if (!supabase && session) {
      setProfile({ role: demoRole, full_name: fullName })
    }
  }, [demoRole, fullName, session])

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthSubmitting(true)

    if (!supabase) {
      setStatusMessage('Signed in successfully.')
      setAuthVisible(false)
      setScreen('dashboard')
      clearAuthDetails()
      setAuthSubmitting(false)
      return
    }

    setStatusMessage('')

    try {
      if (authMode === 'sign-in') {
        const emailType = classifyInstitutionEmail(email)
        if (!emailType) {
          throw new Error('Use your institution email: 9 student numbers or lecturer initial and surname, for example s.tshakaza@ufh.ac.za or stshakaza@ufh.ac.za.')
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setStatusMessage('')
        setAuthVisible(false)
        setScreen('dashboard')
        clearAuthDetails()
      } else {
        const emailType = classifyInstitutionEmail(email)
        if (!emailType) {
          throw new Error('Use your institution email: 9 student numbers or lecturer initial and surname, for example s.tshakaza@ufh.ac.za or stshakaza@ufh.ac.za.')
        }

        if (!isValidName(firstName) || !isValidName(surname) || (middleName && !isValidName(middleName))) {
          throw new Error('Enter a valid first name and surname. Middle name is optional.')
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
                full_name: fullName,
                first_name: firstName.trim(),
                middle_name: middleName.trim(),
                surname: surname.trim(),
                requested_role: emailType,
                institution_domain: email.trim().toLowerCase().split('@')[1],
            },
          },
        })
        if (error) throw error
        setStatusMessage(data.session ? '' : 'Account created. Check your email to confirm your account, then log in.')
        setAuthVisible(false)
        setScreen(data.session ? 'dashboard' : 'landing')
        if (data.session) clearAuthDetails()
      }
    } catch (error) {
      setStatusMessage(error.message)
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleLogOut = async () => {
    if (!supabase) {
      setSession(null)
      setProfile(null)
      setStatusMessage('Demo session ended.')
      setScreen('landing')
      return
    }

    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
    setScreen('landing')
  }

  const handleCreateAssignment = async (event) => {
    event.preventDefault()

    if (!supabase) {
      const newItem = {
        id: Date.now(),
        title,
        description,
        dueDate,
      }
      setAssignments((current) => [newItem, ...current])
      setTitle('')
      setDescription('')
      setDueDate('2026-09-30')
      setStatusMessage('Demo assignment added locally.')
      return
    }

    if (!session?.user) {
      setStatusMessage('Log in before creating assignments.')
      return
    }

    const { error } = await supabase.from('assignments').insert([
      {
        title,
        description,
        due_date: dueDate,
        created_by: session.user.id,
      },
    ])

    if (error) {
      setStatusMessage(error.message)
      return
    }

    setTitle('')
    setDescription('')
    setDueDate('2026-09-30')
    setStatusMessage('Assignment created successfully.')
    await fetchAssignments()
  }

  const runPermissionCheck = async () => {
    if (isFacilitator) {
      setStatusMessage('This check is only for the student experience.')
      return
    }

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const probeDate = tomorrow.toISOString().slice(0, 10)

    const probeEntry = {
      title: 'Student permission probe',
      description: 'This row simulates the direct student insert that should be blocked by the database policy.',
      due_date: probeDate,
      created_by: session?.user?.id || null,
    }

    if (!supabase) {
      setStatusMessage('Blocked by database policy. Students cannot create assignments.')
      return
    }

    const { error } = await supabase.from('assignments').insert([probeEntry])

    if (error) {
      setStatusMessage('Blocked by database policy. Students cannot create assignments.')
      return
    }

    setAssignments((current) => [{ ...probeEntry, id: `probe-${Date.now()}`, course: 'Security check', dueDate: probeDate }, ...current])
    setStatusMessage('The insert succeeded. The UI is hiding controls, but the database is still too permissive.')
  }

  const initials = (name) =>
    (name || 'ST')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'ST'

  const renderAuthForm = () => (
    <div className="auth-card landing-auth">
      <div className="auth-header">
        <div>
          <p className="eyebrow">Authentication</p>
          <h2>{authMode === 'sign-in' ? 'Welcome back' : 'Create your account'}</h2>
        </div>
        {!supabase && (
          <div className="demo-toggle" aria-label="Demo role selector">
            <label>
              Demo role
              <select value={demoRole} onChange={(event) => setDemoRole(event.target.value)}>
                <option value="student">Student</option>
                <option value="facilitator">Facilitator</option>
              </select>
            </label>
          </div>
        )}
      </div>

      <form onSubmit={handleAuthSubmit} className="auth-form">
        {authMode === 'sign-up' && (
          <div className="name-fields">
            <label>
              First name
              <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Jordan" required />
            </label>
            <label>
              Middle name <span className="optional-label">Optional</span>
              <input value={middleName} onChange={(event) => setMiddleName(event.target.value)} placeholder="Lee" />
            </label>
            <label>
              Surname
              <input value={surname} onChange={(event) => setSurname(event.target.value)} placeholder="Mokoena" required />
            </label>
          </div>
        )}

        <label>
          Institution email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="123456789@mywsu.ac.za" required />
        </label>

        <label>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="At least 6 characters" minLength="6" required />
        </label>

        <div className="auth-actions">
          <button type="submit" className="primary-button" disabled={authSubmitting}>
            {authSubmitting ? 'Please wait...' : authMode === 'sign-in' ? 'Log in' : 'Register'}
          </button>
          <button type="button" className="text-button" onClick={() => setAuthMode(authMode === 'sign-in' ? 'sign-up' : 'sign-in')}>
            {authMode === 'sign-in' ? 'Need an account?' : 'Back to log in'}
          </button>
        </div>
        {statusMessage && <p className="auth-feedback" role="alert">{statusMessage}</p>}
      </form>
    </div>
  )

  if (screen === 'dashboard' || session) {
    return (
      <main className={`app-shell dashboard-shell ${theme}`}>
        <section className="content">
          <header className={`topbar ${profileMenuOpen ? 'profile-open' : ''}`}>
            <div className="brand-wrap" aria-label="RoleGate home">
              <div className="brand-mark">
                <Sparkles size={16} />
              </div>
            </div>

            <nav className="nav-inline" aria-label="Primary navigation">
              <button type="button" className={`nav-item ${workspaceView === 'home' ? 'active' : 'muted'}`} onClick={() => setWorkspaceView('home')}>
                <span className="nav-dot home" />Overview
              </button>
              <button type="button" className={`nav-item ${workspaceView === 'assignments' ? 'active' : 'muted'}`} onClick={() => setWorkspaceView('assignments')}>
                <span className="nav-dot assignments" />Assignments
              </button>
              <button type="button" className={`nav-item ${workspaceView === 'tests' ? 'active' : 'muted'}`} onClick={() => setWorkspaceView('tests')}>
                <span className="nav-dot tests" />Tests
              </button>
              <button type="button" className={`nav-item ${workspaceView === 'courses' ? 'active' : 'muted'}`} onClick={() => setWorkspaceView('courses')}>
                <span className="nav-dot courses" />Courses
              </button>
              {isFacilitator && (
                <button type="button" className={`nav-item ${workspaceView === 'monitoring' ? 'active' : 'muted'}`} onClick={() => setWorkspaceView('monitoring')}>
                  <span className="nav-dot monitoring" />Monitor
                </button>
              )}
            </nav>

            <div className="topbar-actions">
              <button
                type="button"
                className="theme-toggle dashboard-theme-toggle"
                onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
                aria-label="Toggle theme"
                title="Toggle theme"
              >
                {theme === 'light' ? <MoonStar size={17} /> : <SunMedium size={17} />}
              </button>
              <button type="button" className="icon-button" title="Notifications">
                <Bell size={18} />
              </button>
              <div className="profile-menu-wrap">
                <button type="button" className="profile-button" onClick={() => setProfileMenuOpen((current) => !current)} aria-expanded={profileMenuOpen} aria-label="Open profile menu">
                  <span className="avatar avatar-lilac">{initials(profile?.full_name || 'Student')}</span>
                  <ChevronDown size={15} />
                </button>
                {profileMenuOpen && (
                  <div className="profile-menu">
                    <div className="profile-menu-heading">
                      <span className="avatar avatar-lilac">{initials(profile?.full_name || 'Student')}</span>
                      <span>
                        <strong>{profile?.full_name || [profile?.first_name, profile?.middle_name, profile?.surname].filter(Boolean).join(' ') || 'Student'}</strong>
                        <small>{session?.user?.email || 'Demo account'}</small>
                      </span>
                    </div>
                    <button type="button" onClick={() => { setWorkspaceView('assignments'); setStatusMessage('Assignment scores will appear here as submissions are graded.'); setProfileMenuOpen(false); }}>
                      <Target size={16} />Assignment scores
                    </button>
                    <button type="button" onClick={() => { setWorkspaceView('tests'); setStatusMessage('Your completed test scores are shown in the Tests workspace.'); setProfileMenuOpen(false); }}>
                      <ClipboardList size={16} />Test scores
                    </button>
                    <button type="button" onClick={() => { setWorkspaceView('tests'); setStatusMessage('Past tests are ready for practice in the Tests workspace.'); setProfileMenuOpen(false); }}>
                      <BookOpen size={16} />Practice past tests
                    </button>
                    <button type="button" onClick={() => { setStatusMessage('Complaint form opened for your assignment marker or creator.'); setProfileMenuOpen(false); }}>
                      <MessageSquareWarning size={16} />Write a complaint
                    </button>
                    <button type="button" onClick={handleLogOut} className="danger-menu-item">
                      <LogOut size={16} />Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="page-heading">
            <div>
              <p className="eyebrow">Role-aware portal</p>
              <h1>{workspaceView === 'home' && isFacilitator ? 'Facilitator overview' : workspaceView === 'home' ? 'Good to see you' : workspaceView === 'assignments' ? 'Assignments dashboard' : workspaceView === 'tests' ? 'Tests and practice' : workspaceView === 'monitoring' ? 'Exam monitoring' : 'Your courses'}</h1>
              <p className="lede">{workspaceView === 'home' && isFacilitator ? 'Monitor student progress, review flagged exam activity, and support your classes.' : workspaceView === 'home' ? 'Here is your learning overview for today.' : workspaceView === 'assignments' ? 'Track coursework, deadlines, and facilitator actions in one place.' : workspaceView === 'tests' ? 'Review scores and practise with tests you have already completed.' : workspaceView === 'monitoring' ? 'Review visibility events and activity notes from active exam sessions.' : 'See the courses connected to your learning workspace.'}</p>
            </div>
            {isFacilitator && workspaceView === 'assignments' && (
              <button type="button" className="primary-button" onClick={() => setStatusMessage('Use the form below to create an assignment.') }>
                <Plus size={17} />Create assignment
              </button>
            )}
          </div>

          {statusMessage && (
            <div className="status-banner" role="status">
              <span>{statusMessage}</span>
              <button type="button" className="status-dismiss" onClick={() => setStatusMessage('')} aria-label="Dismiss message">
                <X size={16} />
              </button>
            </div>
          )}

          {workspaceView === 'home' && !isFacilitator ? (
            <>
              <div className="overview-grid">
                <div className="overview-stat overview-stat-alert">
                  <span>Missed notifications</span>
                  <strong>3</strong>
                  <small>Needs your attention</small>
                </div>
                <div className="overview-stat">
                  <span>Incomplete tasks</span>
                  <strong>4</strong>
                  <small>Across 3 courses</small>
                </div>
                <div className="overview-stat">
                  <span>Overall rating</span>
                  <strong>86%</strong>
                  <small>Above your 80% goal</small>
                </div>
                <div className="overview-stat overview-stat-progress">
                  <span>Goal achievement</span>
                  <strong>72%</strong>
                  <div className="progress-track"><span style={{ width: '72%' }} /></div>
                  <small>4 of 5 weekly goals complete</small>
                </div>
              </div>

              <div className="overview-columns">
                <section className="overview-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">Stay current</p>
                      <h2>Missed notifications</h2>
                    </div>
                    <Bell size={19} />
                  </div>
                  <div className="notification-list">
                    {mockNotifications.map((notification) => (
                      <div className="notification-item" key={notification.id}>
                        <span className={`notification-dot ${notification.tone}`} />
                        <span><strong>{notification.title}</strong><small>{notification.detail}</small></span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="overview-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">Your focus</p>
                      <h2>Assigned research</h2>
                    </div>
                    <BookOpen size={19} />
                  </div>
                  <div className="research-list">
                    {mockResearch.map((research) => (
                      <div className="research-item" key={research.id}>
                        <span className="resource-icon"><FileText size={16} /></span>
                        <span><strong>{research.title}</strong><small>{research.type} · {research.due}</small></span>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="secondary-button overview-action" onClick={() => setWorkspaceView('assignments')}>
                    <ClipboardList size={16} />Open assignments
                  </button>
                </section>

                <section className="overview-panel security-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">Student security check</p>
                      <h2>Verify your permissions</h2>
                    </div>
                    <ShieldCheck size={19} />
                  </div>
                  <p className="muted">
                    This sends an assignment insert directly to the app. The goal is to prove that the database must reject the student write even when the interface hides the creation action.
                  </p>
                  <button type="button" className="secondary-button overview-action" onClick={runPermissionCheck}>
                    <ShieldCheck size={16} />Run permission check
                  </button>

                  {statusMessage && statusMessage.includes('The insert succeeded') && (
                    <div className="inline-security-note" role="alert">
                      <strong>Permission result:</strong>
                      <span>{statusMessage}</span>
                    </div>
                  )}
                </section>
              </div>
            </>
          ) : (
            <div className="summary-grid">
              <div className="summary-card summary-highlight">
                <span>Portal role</span>
                <strong>{isFacilitator ? 'Facilitator' : 'Student'}</strong>
                <small>
                  <ShieldCheck size={14} /> {isFacilitator ? 'Assignment publishing enabled' : 'Read-only access'}
                </small>
              </div>

              <div className="summary-card">
                <span>Open items</span>
                <strong>{visibleAssignments.filter((assignment) => statusForDueDate(assignment.due_date || assignment.dueDate) === 'Open').length}</strong>
                <small>{filter === 'all' ? 'Across all courses' : `Filtered to ${filter}`}</small>
              </div>

              <div className="summary-card account-summary">
                <span>Account</span>
                <strong>{session?.user?.email || 'Demo user'}</strong>
                <small>
                  <button type="button" className="text-button inline" onClick={handleLogOut}>
                    <LogOut size={14} /> Log out
                  </button>
                </small>
              </div>
            </div>
          )}

          {isFacilitator && (workspaceView === 'home' || workspaceView === 'monitoring') && (
            <section className="facilitator-monitoring">
              <div className="monitor-stat-grid">
                <div className="monitor-stat"><span>Active students</span><strong>28</strong><small>Across your courses</small></div>
                <div className="monitor-stat monitor-stat-alert"><span>Flagged sessions</span><strong>{monitoringEvents.filter((event) => event.severity === 'Review').length}</strong><small>Needs facilitator review</small></div>
                <div className="monitor-stat"><span>Incomplete work</span><strong>11</strong><small>Submissions outstanding</small></div>
                <div className="monitor-stat"><span>Average performance</span><strong>78%</strong><small>Across recent tests</small></div>
              </div>

              <div className="monitor-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Exam safety log</p>
                    <h2>Recent monitoring events</h2>
                  </div>
                  <ShieldCheck size={19} />
                </div>
                <p className="monitor-disclaimer">Visibility events indicate that the exam page was hidden or the window changed. Review context before taking action.</p>
                <div className="monitor-table">
                  {monitoringEvents.map((event) => (
                    <div className="monitor-row" key={event.id}>
                      <span className={`event-severity ${event.severity.toLowerCase()}`}>{event.severity}</span>
                      <span className="monitor-student"><strong>{event.student}</strong><small>{event.test}</small></span>
                      <span className="monitor-note">{event.note}</span>
                      <span className="monitor-time">{event.occurredAt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="monitor-panels-row">
                <div className="monitor-mini-panel">
                  <p className="eyebrow">Student activity</p>
                  <h3>Live exam sessions</h3>
                  <p>22 students are currently working. Session status updates as learners submit or leave an exam screen.</p>
                  <button type="button" className="secondary-button" onClick={() => setStatusMessage('Live student activity refreshed.')}>Refresh activity</button>
                </div>
                <div className="monitor-mini-panel">
                  <p className="eyebrow">Follow up</p>
                  <h3>Review flagged work</h3>
                  <p>Open the event log before contacting a student or recording an academic integrity decision.</p>
                  <button type="button" className="secondary-button" onClick={() => setStatusMessage('Flagged event review is ready.')}>Review flags</button>
                </div>
              </div>
            </section>
          )}

          {workspaceView === 'assignments' && (
            <>
              <div className="toolbar-row">
                <div className="filter-group" aria-label="Assignment filters">
                  {FILTERS.map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={`filter-button ${filter === item ? 'active' : ''}`}
                      onClick={() => setFilter(item)}
                    >
                      {item === 'all' ? 'All' : item === 'open' ? 'Open' : 'Overdue'}
                    </button>
                  ))}
                </div>
              </div>

              {isFacilitator && (
                <form className="create-form" onSubmit={handleCreateAssignment}>
                  <div className="form-header">
                    <div>
                      <p className="eyebrow">Create assignment</p>
                      <h3>Publish a new task</h3>
                    </div>
                    <UserCircle2 size={22} />
                  </div>

                  <label>
                    Assignment title
                    <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Submission project" required />
                  </label>

                  <label>
                    Description
                    <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add a short description" rows={3} />
                  </label>

                  <label>
                    Due date
                    <input value={dueDate} onChange={(event) => setDueDate(event.target.value)} type="date" required />
                  </label>

                  <button type="submit" className="primary-button">
                    <Plus size={17} />Publish assignment
                  </button>
                </form>
              )}

              <div className="section-heading">
                <div>
                  <h2>Course assignments</h2>
                  <p>Open and overdue items are calculated automatically from each due date.</p>
                </div>
              </div>

              <div className="assignment-list">
                {visibleAssignments.length === 0 ? (
                  <div className="empty-state">No assignments match the current filter.</div>
                ) : (
                  visibleAssignments.map((assignment) => {
                    const dueValue = assignment.due_date || assignment.dueDate
                    const currentStatus = statusForDueDate(dueValue)

                    return (
                      <article key={assignment.id} className="assignment-row">
                        <div className="course-block">
                          <span className="course-label">Course</span>
                          <strong>{assignment.course || 'General Course'}</strong>
                        </div>

                        <div className="assignment-copy">
                          <h4>{assignment.title}</h4>
                          <p>{assignment.description || 'No description provided.'}</p>
                        </div>

                        <div className="due-pane">
                          <CalendarDays size={15} />
                          <span>Due {formatDueDate(dueValue)}</span>
                        </div>

                        <div className={`status-pill ${currentStatus.toLowerCase()}`}>{currentStatus}</div>
                      </article>
                    )
                  })
                )}
              </div>
            </>
          )}

          {workspaceView === 'tests' && (
            <section className="workspace-panel">
              <div className="section-heading">
                <div>
                  <h2>Past tests to practise</h2>
                  <p>Review previous results and revisit test topics at your own pace.</p>
                </div>
              </div>
              <div className="resource-grid">
                {mockTests.map((test) => (
                  <article className="resource-card" key={test.id}>
                    <div className="resource-icon"><FileText size={18} /></div>
                    <span className="resource-kicker">{test.course}</span>
                    <h3>{test.title}</h3>
                    <div className="resource-meta"><strong>{test.score}</strong><span>{test.status}</span></div>
                    <button type="button" className="secondary-button" onClick={() => { setActiveTest(test); setStatusMessage(`${test.title} practice mode started. Leaving this screen will be recorded for review.`); }}>
                      <BookOpen size={16} />Practise test
                    </button>
                  </article>
                ))}
              </div>
              {activeTest && (
                <div className="practice-banner">
                  <div>
                    <p className="eyebrow">Practice session active</p>
                    <h3>{activeTest.title}</h3>
                    <p>Keep this exam screen open while practising. Switching tabs or hiding the window creates a review event.</p>
                  </div>
                  <button type="button" className="primary-button" onClick={() => setActiveTest(null)}>End practice</button>
                </div>
              )}
            </section>
          )}

          {workspaceView === 'courses' && (
            <section className="workspace-panel">
              <div className="section-heading">
                <div>
                  <h2>Enrolled courses</h2>
                  <p>Assignments, tests, and learning materials are organised by course.</p>
                </div>
              </div>
              <div className="resource-grid course-grid">
                {mockCourses.map((course) => (
                  <article className="resource-card course-card" key={course.id}>
                    <div className="resource-icon"><BookOpen size={18} /></div>
                    <h3>{course.title}</h3>
                    <p>{course.detail}</p>
                    <button type="button" className="secondary-button" onClick={() => { setWorkspaceView('assignments'); setStatusMessage(`${course.title} assignments are now selected.`); }}>
                      <ArrowRight size={16} />View assignments
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>
    )
  }

  return (
    <main className={`landing-shell ${theme}`}>
      <header className="landing-header">
        <div className="brand-wrap">
          <div className="brand-mark" aria-label="RoleGate home">
            <Sparkles size={18} />
          </div>
          <div className="brand-copy">
            <strong>RoleGate</strong>
            <span>Assignments</span>
          </div>
        </div>

        <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
          <a href="#explore">Explore</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <button type="button" className="mobile-nav-action ghost-button" onClick={() => { setAuthMode('sign-in'); setAuthVisible(true); setMenuOpen(false); }}>
            Log in
          </button>
          <button type="button" className="mobile-nav-action primary-button" onClick={() => { setAuthMode('sign-up'); setAuthVisible(true); setMenuOpen(false); }}>
            Register
          </button>
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <MoonStar size={18} /> : <SunMedium size={18} />}
          </button>

          <button type="button" className="ghost-button" onClick={() => { setAuthMode('sign-in'); setAuthVisible(true); }}>
            Log in
          </button>
          <button type="button" className="primary-button" onClick={() => { setAuthMode('sign-up'); setAuthVisible(true); }}>
            Register
          </button>

          <button type="button" className="menu-button" aria-label="Open menu" onClick={() => setMenuOpen((current) => !current)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Built for modern learning</p>
          <h1>Smarter assignment management for every classroom.</h1>
          <p className="lede">
            RoleGate helps students stay on top of deadlines and gives facilitators a secure place to publish work, track progress, and keep learning organized.
          </p>

          <div className="hero-actions">
            <button type="button" className="primary-button large" onClick={() => { setAuthMode('sign-up'); setAuthVisible(true); }}>
              Get started <ArrowRight size={18} />
            </button>
            <a href="#explore" className="secondary-button">
              Explore
            </a>
          </div>

          <div className="hero-stats">
            <div>
              <strong>12k+</strong>
              <span>students supported</span>
            </div>
            <div>
              <strong>96%</strong>
              <span>on-time tracking</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>AI guidance</span>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-label="Product illustration">
          <div className="mini-panel board-panel">
            <div className="mini-header">
              <span>Assignments</span>
              <span className="status-flag">Live</span>
            </div>

            <ul>
              <li>
                <span>Database Design</span>
                <em>Overdue</em>
              </li>
              <li>
                <span>UX Sprint Review</span>
                <em>Open</em>
              </li>
              <li>
                <span>Research Notes</span>
                <em>Open</em>
              </li>
            </ul>
          </div>

          <div className="mini-panel floating-card">
            <div className="avatar-stack">
              <span>JD</span>
              <span>AL</span>
              <span>RK</span>
            </div>
            <p>Facilitator updates are visible in real time.</p>
          </div>
        </div>
      </section>

      <section id="explore" className="feature-section">
        <div className="section-heading centered">
          <p className="eyebrow">Why RoleGate</p>
          <h2>Everything your learning workflow needs.</h2>
        </div>

        <div className="feature-grid">
          {featureCards.map(({ icon: Icon, title, description }) => (
            <article key={title} className="feature-card">
              <div className="icon-badge">
                <Icon size={18} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="story-section">
        <div className="story-copy">
          <p className="eyebrow">About</p>
          <h2>Role-based clarity for students and facilitators.</h2>
          <p>
            RoleGate is a student and facilitator portal designed to make learning more organized, transparent, and less stressful. Students always know what is due, while facilitators can publish new tasks with confidence and track the workflow from a single place.
          </p>
        </div>

        <div className="story-points">
          <div>
            <strong>Secure</strong>
            <span>Role-based permissions keep access clear and trusted.</span>
          </div>
          <div>
            <strong>Focused</strong>
            <span>Deadlines, course work, and updates stay in one view.</span>
          </div>
          <div>
            <strong>Helpful</strong>
            <span>AI support answers common questions instantly.</span>
          </div>
        </div>
      </section>

      {authVisible && (
        <section className="auth-wrapper" role="dialog" aria-modal="true" aria-label={authMode === 'sign-in' ? 'Log in' : 'Register'} onMouseDown={() => setAuthVisible(false)}>
          <div className="auth-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setAuthVisible(false)} aria-label="Close authentication form">
              <X size={18} />
            </button>
            {renderAuthForm()}
          </div>
        </section>
      )}

      {statusMessage && (
        <div className="status-banner landing-status" role="status">
          <span>{statusMessage}</span>
          <button type="button" className="status-dismiss" onClick={() => setStatusMessage('')} aria-label="Dismiss message">
            <X size={16} />
          </button>
        </div>
      )}

      <footer id="contact" className="landing-footer">
        <div>
          <p className="eyebrow">Contact</p>
          <h3>Need help or want a demo?</h3>
        </div>

        <div className="footer-actions">
          <a href="mailto:hello@rolegate.app">hello@rolegate.app</a>
          <button type="button" className="primary-button" onClick={() => { setAuthMode('sign-in'); setAuthVisible(true); }}>
            Talk to us
          </button>
        </div>
      </footer>

      <button type="button" className="chat-fab" onClick={() => setChatOpen((current) => !current)} aria-label="Ask the AI assistant">
        <MessageCircle size={22} />
      </button>

      {chatOpen && (
        <div className="chat-bubble">
          <div className="chat-header">
            <div className="chat-title">
              <span className="chat-dot" />
              RoleGate AI
            </div>
            <button type="button" className="mini-close" onClick={() => setChatOpen(false)} aria-label="Close chat assistant">
              <X size={14} />
            </button>
          </div>

          <p>Hi! I can help explain how RoleGate works, how students access assignments, or how facilitators publish tasks.</p>
          <button type="button" className="chat-action" onClick={() => { setChatOpen(false); setAuthVisible(true); setAuthMode('sign-in'); }}>
            Ask about logging in
          </button>
        </div>
      )}
    </main>
  )
}

export default App
