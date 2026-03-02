'use client';

import { useEffect, useState, useRef } from 'react';
import anime from 'animejs';
import type { User } from '@/store/slices/authSlice';
import { useGetCompetitionsQuery } from '@/store/api/competitionsApi';
import { useGetMySubmissionsQuery, useCreateSubmissionMutation, useTriggerEvaluationMutation, useGetCompetitionSubmissionsQuery, useSubmitManualEvaluationMutation, useGetPendingSubmissionsQuery } from '@/store/api/submissionsApi';
import { useGetLeaderboardQuery } from '@/store/api/leaderboardApi';
import { useCreateCompetitionMutation } from '@/store/api/competitionsApi';

type PageName = 'home' | 'competitions' | 'admin' | 'submit' | 'results' | 'leaderboard';

const CHARS = ['{ }', '</>', 'AI', '//', '/**', '*.md', '→', '∑', '∞', '01', 'if', 'AI'];

export default function ArticleArenaApp({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const [currentPage, setCurrentPage] = useState<PageName>('home');
  const [loaderDone, setLoaderDone] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: string } | null>(null);
  const [selectedCompId, setSelectedCompId] = useState<number | null>(null);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [newCompTitle, setNewCompTitle] = useState('');
  const [newCompDesc, setNewCompDesc] = useState('');
  const loaderRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);

  const isAdmin = user.role === 'admin';
  const currentRole = isAdmin ? 'admin' : 'competitor';

  const { data: competitions = [], refetch: refetchComps } = useGetCompetitionsQuery(undefined, { skip: !loaderDone });
  useEffect(() => {
    if (competitions.length > 0 && selectedCompId === null) setSelectedCompId(competitions[0].id);
  }, [competitions, selectedCompId]);
  const { data: mySubmissions = [], refetch: refetchSubs } = useGetMySubmissionsQuery(undefined, {
    skip: !loaderDone,
    pollingInterval: 5000
  });
  const { data: leaderboard = [], refetch: refetchLeaderboard } = useGetLeaderboardQuery(selectedCompId || 0, {
    skip: !selectedCompId || !loaderDone,
    pollingInterval: 5000
  });
  const { data: globalPending = [], refetch: refetchGlobalPending } = useGetPendingSubmissionsQuery(undefined, {
    skip: !isAdmin || !loaderDone,
    pollingInterval: 5000
  });
  const [createSubmission, { isLoading: submitting }] = useCreateSubmissionMutation();
  const [triggerEval] = useTriggerEvaluationMutation();
  const [createCompetition] = useCreateCompetitionMutation();

  const notify = (msg: string, type = '') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    const onScroll = () => {
      document.getElementById('mainNav')?.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!loaderRef.current) return;
    anime({
      targets: '#loaderText',
      clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'],
      easing: 'easeInOutExpo',
      duration: 1000,
      delay: 200,
    });
    anime({
      targets: '#loaderFill',
      width: ['0%', '100%'],
      easing: 'easeInOutExpo',
      duration: 1800,
      delay: 300,
      complete: () => {
        setTimeout(() => {
          anime({
            targets: '#loader',
            opacity: 0,
            easing: 'easeInExpo',
            duration: 600,
            complete: () => {
              if (loaderRef.current) loaderRef.current.style.display = 'none';
              if (appRef.current) appRef.current.style.display = 'block';
              setLoaderDone(true);
            },
          });
        }, 400);
      },
    });
  }, []);

  const showPage = (name: PageName) => {
    setCurrentPage(name);
    if (name === 'leaderboard') {
      if (competitions.length > 0 && !selectedCompId) {
        setSelectedCompId(competitions[0].id);
      }
      refetchLeaderboard();
    }
    if (name === 'results') {
      refetchSubs();
    }
    window.scrollTo(0, 0);
  };

  const handleSubmitArticle = async () => {
    const compId = (document.getElementById('compSelect') as HTMLSelectElement)?.value;
    const title = articleTitle || (document.getElementById('articleTitle') as HTMLInputElement)?.value;
    const content = articleContent || (document.getElementById('articleContent') as HTMLTextAreaElement)?.value;

    if (!compId) {
      notify('Please select a competition', 'error');
      return;
    }

    if (!selectedFile && (!content || content.length < 50)) {
      notify('Please either upload a document or paste content (min 50 chars)', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('competition_id', compId);

      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('content', `# ${title || 'Untitled'}\n\n${content}`);
      }

      await createSubmission(formData).unwrap();
      notify('Article submitted successfully!', 'success');
      refetchSubs();
      setArticleTitle('');
      setArticleContent('');
      setSelectedFile(null);
      if (document.getElementById('fileUpload')) {
        (document.getElementById('fileUpload') as HTMLInputElement).value = '';
      }
      showPage('results');
    } catch (e: unknown) {
      notify((e as { data?: { detail?: string } })?.data?.detail || 'Submission failed', 'error');
    }
  };

  const handleCreateCompetition = async () => {
    if (!newCompTitle.trim()) {
      notify('Please enter a competition title', 'error');
      return;
    }
    try {
      await createCompetition({
        title: newCompTitle,
        description: newCompDesc,
        is_active: true,
      }).unwrap();
      notify('Competition launched!', 'success');
      refetchComps();
      setShowCreateModal(false);
      setNewCompTitle('');
      setNewCompDesc('');
    } catch (e: unknown) {
      notify((e as { data?: { detail?: string } })?.data?.detail || 'Failed to create', 'error');
    }
  };

  const handleTriggerEval = async (subId: number) => {
    try {
      await triggerEval(subId).unwrap();
      notify('AI evaluation started', 'success');
      refetchSubs();
      refetchLeaderboard();
    } catch (e: unknown) {
      notify((e as { data?: { detail?: string } })?.data?.detail || 'Evaluation failed', 'error');
    }
  };

  const activeCount = competitions.filter((c) => c.is_active).length;
  const totalSubs = mySubmissions.length;

  return (
    <>
      <div id="loader" ref={loaderRef} className="fixed inset-0 z-[1000] flex flex-col items-center justify-center gap-6 bg-[#060608]">
        <div id="loaderText" className="loader-logo" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          ARTICLEARENA
        </div>
        <div className="text-xs text-[#5a5a7a] tracking-[0.3em]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          LOADING...
        </div>
        <div className="loader-bar">
          <div id="loaderFill" className="loader-bar-fill" />
        </div>
      </div>

      {notification && (
        <div
          className={`fixed top-[90px] right-6 z-[300] px-6 py-4 max-w-[320px] text-sm transition-transform duration-400 border ${notification.type === 'success' ? 'border-[#00d4aa]' : notification.type === 'error' ? 'border-[#ff4757]' : 'border-[#e8ff47]'
            }`}
          style={{
            background: '#0d0d12',
            transform: 'translateX(0)',
            animation: 'slideIn 0.4s ease',
          }}
        >
          {notification.msg}
        </div>
      )}

      <div id="app" ref={appRef} style={{ display: 'none', minHeight: '100vh' }}>
        <nav
          id="mainNav"
          className="fixed top-0 left-0 right-0 z-[100] py-5 px-12 flex items-center justify-between border-b border-transparent transition-all backdrop-blur-xl"
        >
          <div className="nav-logo" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            ArticleArena
          </div>
          <div className="nav-links flex gap-8 items-center">
            <a className={`nav-link ${currentPage === 'home' ? 'active' : ''}`} onClick={() => showPage('home')}>
              Home
            </a>
            <a className={`nav-link ${currentPage === 'competitions' ? 'active' : ''}`} onClick={() => showPage('competitions')}>
              Competitions
            </a>
            {isAdmin && (
              <a className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`} onClick={() => showPage('admin')}>
                Dashboard
              </a>
            )}
            {!isAdmin && (
              <>
                <a className={`nav-link ${currentPage === 'submit' ? 'active' : ''}`} onClick={() => showPage('submit')}>
                  Submit
                </a>
                <a className={`nav-link ${currentPage === 'results' ? 'active' : ''}`} onClick={() => showPage('results')}>
                  My Results
                </a>
              </>
            )}
            <a className={`nav-link ${currentPage === 'leaderboard' ? 'active' : ''}`} onClick={() => showPage('leaderboard')}>
              Rankings
            </a>
          </div>
          <div className={`role-badge ${currentRole}`}>
            <div className="role-dot" />
            <span>{currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}</span>
            <button onClick={onLogout} className="ml-2 text-xs opacity-70 hover:opacity-100">
              Logout
            </button>
          </div>
        </nav>

        {/* HOME */}
        <div className={`page ${currentPage === 'home' ? 'active' : ''}`} id="page-home">
          <div className="hero min-h-screen flex flex-col items-center justify-center text-center px-12 relative overflow-hidden">
            <div className="hero-bg-grid absolute inset-0" />
            <div className="hero-orb hero-orb-1 absolute" />
            <div className="hero-orb hero-orb-2 absolute" />
            <div className="floating-chars absolute inset-0 pointer-events-none overflow-hidden">
              {CHARS.map((c, i) => (
                <div
                  key={i}
                  className="float-char absolute text-sm text-[rgba(232,255,71,0.08)]"
                  style={{
                    left: `${5 + Math.random() * 90}%`,
                    animationDelay: `${i * 1.5}s`,
                    animationDuration: `${12 + Math.random() * 8}s`,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
            <div className="hero-eyebrow flex items-center gap-3 mb-6">
              <div className="eyebrow-line w-10 h-px bg-[#e8ff47]" />
              AI-Powered Writing Platform
              <div className="eyebrow-line w-10 h-px bg-[#e8ff47]" />
            </div>
            <h1 className="hero-title mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              <span className="line1 block text-[#e8e8f0]">WRITE</span>
              <span className="line2 block text-[#e8ff47]">COMPETE.</span>
            </h1>
            <p className="hero-sub text-lg text-[#5a5a7a] max-w-[520px] mb-14">
              Submit articles. Get scored by AI across 4 criteria. Rise through the ranks.
            </p>
            <div className="hero-ctas flex gap-4 flex-wrap justify-center">
              <button className="btn-primary" onClick={() => showPage('competitions')}>
                View Competitions
              </button>
              {!isAdmin && (
                <button className="btn-secondary" onClick={() => showPage('submit')}>
                  Submit Article
                </button>
              )}
            </div>
            <div className="hero-stats absolute bottom-12 left-12 flex gap-12">
              <div className="stat text-left">
                <div className="stat-num" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  {activeCount}
                </div>
                <div className="stat-label">Active Competitions</div>
              </div>
              <div className="stat text-left">
                <div className="stat-num" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  {totalSubs}
                </div>
                <div className="stat-label">My Submissions</div>
              </div>
            </div>
          </div>
        </div>

        {/* COMPETITIONS */}
        <div className={`page ${currentPage === 'competitions' ? 'active' : ''}`} id="page-competitions">
          <div className="section py-[120px] px-12">
            <div className="section-header flex items-end justify-between mb-20">
              <div>
                <div className="section-tag flex items-center gap-3 mb-4">
                  <span>◆</span> Active Competitions
                </div>
                <div className="section-title" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  COMPETE<br />NOW
                </div>
              </div>
              {isAdmin && (
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                  + Create Competition
                </button>
              )}
            </div>
            <div className="competitions-grid grid gap-[2px] grid-cols-[repeat(auto-fill,minmax(380px,1fr))]">
              {competitions.map((c, i) => (
                <div
                  key={c.id}
                  className="comp-card p-10 border border-[#1e1e2e] bg-[#0d0d12] cursor-pointer transition-all hover:bg-[#13131a] hover:border-[rgba(232,255,71,0.2)] hover:-translate-y-1"
                  onClick={() => {
                    if (!isAdmin) {
                      showPage('submit');
                      setSelectedCompId(c.id);
                    } else {
                      showPage('leaderboard');
                      setSelectedCompId(c.id);
                    }
                  }}
                >
                  <div
                    className="comp-card-num absolute right-6 top-4 text-[#1e1e2e] text-8xl leading-none"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div
                    className={`comp-status ${c.is_active ? 'active' : 'closed'} inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase mb-5`}
                  >
                    <div className="status-dot w-1.5 h-1.5 rounded-full bg-current" />
                    {c.is_active ? 'ACTIVE' : 'CLOSED'}
                  </div>
                  <div className="comp-title text-xl font-extrabold leading-tight mb-3 relative z-10">
                    {c.title}
                  </div>
                  <div className="comp-desc text-sm text-[#5a5a7a] leading-relaxed mb-8">
                    {c.description || 'No description'}
                  </div>
                  <div className="comp-meta flex gap-6 items-center pt-6 border-t border-[#1e1e2e]">
                    <div className="comp-meta-item flex flex-col gap-0.5">
                      <div className="comp-meta-label text-[10px] text-[#5a5a7a] tracking-wider uppercase">
                        Status
                      </div>
                      <div
                        className="comp-meta-val text-base font-bold text-[#e8ff47]"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {c.is_active ? 'OPEN' : 'CLOSED'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ADMIN DASHBOARD */}
        {isAdmin && (
          <div className={`page ${currentPage === 'admin' ? 'active' : ''}`} id="page-admin">
            <div className="section py-[120px] px-12">
              <div className="section-header mb-20">
                <div className="section-tag flex items-center gap-3 mb-4">
                  <span>◆</span> Admin Dashboard
                </div>
                <div className="section-title" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  COMMAND<br />CENTER
                </div>
              </div>
              <div className="dashboard-grid grid grid-cols-4 gap-[2px] mb-[2px]">
                <div className="metric-card p-8 border border-[#1e1e2e] bg-[#0d0d12]">
                  <div className="metric-label text-[11px] tracking-wider uppercase text-[#5a5a7a] mb-4">
                    Total Competitions
                  </div>
                  <div className="metric-value text-5xl text-[#e8ff47] leading-none mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    {competitions.length}
                  </div>
                </div>
                <div className="metric-card p-8 border border-[#1e1e2e] bg-[#0d0d12]">
                  <div className="metric-label text-[11px] tracking-wider uppercase text-[#5a5a7a] mb-4">
                    Your Role
                  </div>
                  <div className="metric-value text-5xl text-[#e8ff47] leading-none mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    Admin
                  </div>
                </div>
              </div>

              {/* ADMIN REVIEW SUBMISSIONS */}
              <AdminSubmissionReview competitions={competitions} globalPending={globalPending} />
            </div>
          </div>
        )}

        {/* SUBMIT */}
        {!isAdmin && (
          <div className={`page ${currentPage === 'submit' ? 'active' : ''}`} id="page-submit">
            <div className="section py-[120px] px-12">
              <div className="section-header mb-20">
                <div className="section-tag flex items-center gap-3 mb-4">
                  <span>◆</span> Article Submission
                </div>
                <div className="section-title" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  SUBMIT<br />YOUR WORK
                </div>
              </div>
              <div className="submit-form max-w-[800px] mx-auto">
                <div className="form-group mb-8">
                  <label className="form-label block text-[11px] tracking-wider uppercase text-[#5a5a7a] mb-3">
                    Select Competition
                  </label>
                  <select
                    id="compSelect"
                    className="form-input form-select w-full px-5 py-4 bg-[#0d0d12] border border-[#1e1e2e] text-[#e8e8f0]"
                  >
                    <option value="">-- Choose a competition --</option>
                    {competitions.filter((c) => c.is_active).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group mb-8">
                  <label className="form-label block text-[11px] tracking-wider uppercase text-[#5a5a7a] mb-3">
                    Article Title
                  </label>
                  <input
                    id="articleTitle"
                    type="text"
                    className="form-input w-full px-5 py-4 bg-[#0d0d12] border border-[#1e1e2e] text-[#e8e8f0]"
                    placeholder="Enter your article title..."
                    value={articleTitle}
                    onChange={(e) => setArticleTitle(e.target.value)}
                  />
                </div>
                <div className="form-group mb-8">
                  <label className="form-label block text-[11px] tracking-wider uppercase text-[#5a5a7a] mb-3">
                    Upload Document (Optional)
                  </label>
                  <input
                    id="fileUpload"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="form-input w-full px-5 py-4 bg-[#0d0d12] border border-[#1e1e2e] text-[#e8e8f0] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-bold file:bg-[#1e1e2e] file:text-[#e8ff47] hover:file:bg-[#2a2a3c]"
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  />
                  <p className="text-xs text-[#5a5a7a] mt-2">Accepted formats: .pdf, .docx, .doc, .txt</p>
                </div>
                <div className="form-group mb-8 text-center text-[#5a5a7a] text-sm font-bold my-4">
                  - OR -
                </div>
                <div className="form-group mb-8">
                  <label className="form-label block text-[11px] tracking-wider uppercase text-[#5a5a7a] mb-3">
                    Article Content
                  </label>
                  <textarea
                    id="articleContent"
                    className="form-textarea w-full min-h-[400px] p-5 bg-[#0d0d12] border border-[#1e1e2e] text-[#e8e8f0]"
                    placeholder="Start writing..."
                    value={articleContent}
                    onChange={(e) => setArticleContent(e.target.value)}
                    disabled={!!selectedFile}
                  />
                </div>
                <button className="btn-primary" onClick={handleSubmitArticle} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Article'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {!isAdmin && (
          <div className={`page ${currentPage === 'results' ? 'active' : ''}`} id="page-results">
            <div className="section py-[120px] px-12">
              <div className="section-header mb-20">
                <div className="section-tag flex items-center gap-3 mb-4">
                  <span>◆</span> My Results
                </div>
                <div className="section-title" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  YOUR<br />SCORES
                </div>
              </div>
              <div className="grid grid-cols-[1fr_2fr] gap-[2px]">
                <div className="bg-[#0d0d12] border border-[#1e1e2e] p-12 flex flex-col items-center justify-center text-center">
                  <div className="text-[11px] text-[#5a5a7a] tracking-wider uppercase mb-6">Your Submissions</div>
                  <div className="text-5xl text-[#e8ff47]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    {mySubmissions.length}
                  </div>
                </div>
                <div className="bg-[#0d0d12] border border-[#1e1e2e] p-12">
                  <div className="text-[11px] text-[#5a5a7a] tracking-wider uppercase mb-8">Recent</div>
                  {mySubmissions.length === 0 ? (
                    <p className="text-[#5a5a7a]">No submissions yet. Submit an article to get AI feedback!</p>
                  ) : (
                    <div className="space-y-4">
                      {mySubmissions.slice(0, 5).map((s) => (
                        <div key={s.id} className="py-6 border-b border-[#1e1e2e]">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-bold text-lg">Submission #{s.id}</div>
                              <div className="text-[10px] text-[#5a5a7a] uppercase tracking-widest mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                {s.status}
                              </div>
                            </div>
                            {s.evaluation && (
                              <div className="text-4xl text-[#e8ff47]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                {Math.round(s.evaluation.score)}
                              </div>
                            )}
                          </div>
                          {s.evaluation?.feedback && (
                            <div className="mt-4 p-4 bg-[#1a1a24] border-l-2 border-[#e8ff47] text-sm text-[#cecede] italic leading-relaxed">
                              "{s.evaluation.feedback}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LEADERBOARD */}
        <div className={`page ${currentPage === 'leaderboard' ? 'active' : ''}`} id="page-leaderboard">
          <div className="section py-[120px] px-12">
            <div className="section-header mb-20 flex flex-col items-center text-center">
              <div className="section-tag flex items-center justify-center gap-3 mb-4">
                <span>◆</span> Global Rankings
              </div>
              <div className="section-title text-[80px] leading-none text-[#e8ff47]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                THE ARENA
              </div>
              <p className="text-[#5a5a7a] mt-4 max-w-[600px]">See how you stack up against other writers in each active competition topic.</p>
            </div>

            <div className="leaderboards-container max-w-[1000px] mx-auto space-y-24">
              {competitions.length === 0 ? (
                <div className="py-12 text-center text-[#5a5a7a]">No active competitions yet.</div>
              ) : (
                competitions.map(comp => (
                  <CompetitionLeaderboard key={comp.id} competitionId={comp.id} competitionTitle={comp.title} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CREATE COMPETITION MODAL */}
      {showCreateModal && (
        <div
          className="modal-overlay fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(6,6,8,0.95)] backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <div className="modal bg-[#0d0d12] border border-[#1e1e2e] p-12 w-[90%] max-w-[700px] max-h-[90vh] overflow-y-auto relative">
            <button
              className="modal-close absolute top-6 right-6 w-9 h-9 border border-[#1e1e2e] text-[#e8e8f0] flex items-center justify-center hover:border-[#ff4757] hover:text-[#ff4757]"
              onClick={() => setShowCreateModal(false)}
            >
              ✕
            </button>
            <div className="modal-title text-5xl mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              NEW COMPETITION
            </div>
            <div className="modal-sub text-[#5a5a7a] text-sm mb-10">
              Configure your writing competition.
            </div>
            <div className="form-group mb-8">
              <label className="form-label block text-[11px] tracking-wider uppercase text-[#5a5a7a] mb-3">
                Competition Title
              </label>
              <input
                type="text"
                className="form-input w-full px-5 py-4 bg-[#0d0d12] border border-[#1e1e2e] text-[#e8e8f0]"
                placeholder="e.g. The Future of Quantum Computing"
                value={newCompTitle}
                onChange={(e) => setNewCompTitle(e.target.value)}
              />
            </div>
            <div className="form-group mb-8">
              <label className="form-label block text-[11px] tracking-wider uppercase text-[#5a5a7a] mb-3">
                Description
              </label>
              <textarea
                className="form-textarea w-full min-h-[140px] p-5 bg-[#0d0d12] border border-[#1e1e2e] text-[#e8e8f0]"
                placeholder="Describe what competitors should write about..."
                value={newCompDesc}
                onChange={(e) => setNewCompDesc(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={handleCreateCompetition}>
              Launch Competition
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function CompetitionLeaderboard({ competitionId, competitionTitle }: { competitionId: number, competitionTitle: string }) {
  const { data: leaderboard = [], isLoading } = useGetLeaderboardQuery(competitionId, {
    pollingInterval: 5000
  });

  if (isLoading) return <div className="text-[#5a5a7a]">Loading scores for {competitionTitle}...</div>;

  return (
    <div className="competition-leaderboard bg-[#0d0d12] border border-[#1e1e2e] p-8">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#1e1e2e]">
        <h3 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#e8ff47]"></div>
          {competitionTitle}
        </h3>
        <div className="text-[11px] uppercase tracking-wider text-[#5a5a7a] bg-[#1a1a24] px-3 py-1 rounded">
          {leaderboard.length} Participants
        </div>
      </div>

      <div className="lb-header grid grid-cols-[60px_1fr_120px_80px] gap-4 py-2 px-4 text-[11px] tracking-wider uppercase text-[#5a5a7a] mb-4">
        <div>Rank</div>
        <div>Competitor</div>
        <div>Score</div>
        <div>Status</div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="py-8 text-center text-[#5a5a7a] italic">
          No evaluations completed yet.
        </div>
      ) : (
        leaderboard.map((entry) => {
          // Generate deterministic dicebear avatar based on email
          const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(entry.competitor_email || 'default')}&colors=e8ff47,00d4aa,ff4757,7c6eff`;

          return (
            <div
              key={entry.submission_id}
              className="lb-row grid grid-cols-[60px_1fr_120px_80px] gap-4 py-4 px-4 items-center border-b border-[#1e1e2e] hover:bg-[#15151f] transition-all"
            >
              <div
                className={`lb-rank text-3xl ${entry.rank === 1 ? 'text-[#FFD700]' : entry.rank === 2 ? 'text-[#C0C0C0]' : entry.rank === 3 ? 'text-[#CD7F32]' : 'text-[#5a5a7a]'
                  }`}
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                {entry.rank}
              </div>
              <div className="lb-user flex items-center gap-4">
                <div className="w-12 h-12 rounded bg-[#1e1e2e] flex items-center justify-center overflow-hidden border border-[#2a2a3c]">
                  <img src={avatarUrl} alt="avatar" className="w-[85%] h-[85%] object-contain" />
                </div>
                <div className="flex flex-col">
                  <div className="lb-name font-bold leading-tight">{entry.competitor_email}</div>
                  <div className="text-[10px] text-[#5a5a7a] uppercase tracking-wider mt-1">Writer</div>
                </div>
              </div>
              <div className="lb-total text-3xl text-[#e8ff47]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {Math.round(entry.score)}
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#00d4aa]">✔ CHECKED</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function AdminSubmissionReview({ competitions, globalPending }: { competitions: any[], globalPending: any[] }) {
  const [selectedCompId, setSelectedCompId] = useState<number | null>(null);
  const [expandedSubId, setExpandedSubId] = useState<number | null>(null);
  const [manualScore, setManualScore] = useState<string>('');
  const [manualFeedback, setManualFeedback] = useState<string>('');
  const [evaluatingSubId, setEvaluatingSubId] = useState<number | null>(null);

  const { data: submissions = [], isLoading, refetch } = useGetCompetitionSubmissionsQuery(selectedCompId || 0, {
    skip: !selectedCompId,
    pollingInterval: 3000
  });

  // Watch for evaluation completion
  useEffect(() => {
    if (evaluatingSubId) {
      const sub = submissions.find(s => s.id === evaluatingSubId);
      if (sub && sub.status === 'evaluated') {
        setEvaluatingSubId(null);
        setExpandedSubId(sub.id);
      }
    }
  }, [submissions, evaluatingSubId]);

  const [triggerEval, { isLoading: isTriggering }] = useTriggerEvaluationMutation();
  const [submitManual, { isLoading: isSubmitting }] = useSubmitManualEvaluationMutation();

  const handleTriggerAI = async (subId: number) => {
    try {
      setEvaluatingSubId(subId);
      await triggerEval(subId).unwrap();
      // No more alert, the animation handles the feedback
    } catch (err: any) {
      setEvaluatingSubId(null);
      alert(err.data?.detail || 'Error triggering AI evaluation');
    }
  };

  const handleManualEval = async (subId: number) => {
    if (!manualScore || isNaN(Number(manualScore))) {
      alert('Please enter a valid numeric score');
      return;
    }
    try {
      await submitManual({ submissionId: subId, score: Number(manualScore), feedback: manualFeedback }).unwrap();
      // Manual refetch not strictly needed if tags work, but good for UX responsiveness
      refetch();
      setManualScore('');
      setManualFeedback('');
      setExpandedSubId(null);
    } catch (err: any) {
      alert(err.data?.detail || 'Error submitting manual evaluation');
    }
  };

  return (
    <div className="mt-12 bg-[#0d0d12] border border-[#1e1e2e] p-8">
      <div className="text-[11px] uppercase tracking-wider text-[#5a5a7a] mb-6 border-b border-[#1e1e2e] pb-4">
        Review Submissions
      </div>
      <div className="mb-8">
        <label className="text-[11px] uppercase tracking-wider text-[#5a5a7a] block mb-2">Select Competition to Review</label>
        <select
          className="form-input form-select w-full md:w-1/2 px-4 py-3 bg-[#15151f] border border-[#1e1e2e] text-[#e8e8f0]"
          value={selectedCompId || ''}
          onChange={(e) => {
            setSelectedCompId(Number(e.target.value));
            setExpandedSubId(null);
          }}
        >
          <option value="">-- Select --</option>
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* NEW: Global Pending Submissions Section */}
      {!selectedCompId && (
        <div className="mb-12">
          <div className="text-[11px] uppercase tracking-wider text-[#e8ff47] mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e8ff47] animate-pulse"></span>
            Pending Evaluations ({globalPending.length})
          </div>
          {globalPending.length === 0 ? (
            <div className="p-8 border border-dashed border-[#1e1e2e] text-center text-[#5a5a7a] text-sm">
              No pending submissions to evaluate. Great job!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {globalPending.map((sub: any) => (
                <div key={sub.id} className="bg-[#15151f] border border-[#1e1e2e] p-6 hover:border-[#e8ff47]/30 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-[10px] text-[#5a5a7a] uppercase mb-1">Submission #{sub.id}</div>
                      <div className="font-bold text-white group-hover:text-[#e8ff47] transition-colors line-clamp-1">
                        {competitions.find(c => c.id === sub.competition_id)?.title || 'Unknown Competition'}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#5a5a7a] line-clamp-2 mb-6">
                    {sub.content.substring(0, 100)}...
                  </div>
                  <button
                    className="w-full btn-secondary text-[10px] py-2 flex items-center justify-center gap-2 hover:bg-[#e8ff47] hover:text-black"
                    onClick={() => {
                      setSelectedCompId(sub.competition_id);
                      setExpandedSubId(sub.id);
                    }}
                  >
                    Go to Review ➝
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedCompId && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-[#5a5a7a]">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="text-[#5a5a7a]">No submissions found for this competition.</div>
          ) : (
            submissions.map((sub: any) => (
              <div key={sub.id} className="border border-[#1e1e2e] bg-[#15151f] p-6">
                {/* ... existing row content ... */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="font-bold text-[#e8e8f0]">Submission #{sub.id}</div>
                    <div className="text-[11px] text-[#5a5a7a] mt-1">Status: {sub.status.toUpperCase()}</div>
                  </div>
                  <button
                    className="btn-secondary text-[11px] py-2 px-4 hover:bg-[#e8ff47] hover:text-black transition-all"
                    onClick={() => {
                      setExpandedSubId(expandedSubId === sub.id ? null : sub.id);
                      setManualScore('');
                      setManualFeedback('');
                    }}
                  >
                    {expandedSubId === sub.id ? 'Close' : 'Review'}
                  </button>
                </div>

                {expandedSubId === sub.id && (
                  <div className="mt-6 pt-6 border-t border-[#1e1e2e] grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="article-content bg-[#0d0d12] p-6 border border-[#1e1e2e] max-h-[500px] overflow-y-auto whitespace-pre-wrap text-sm text-[#cecede] font-[Inter]">
                      {sub.content}
                    </div>

                    <div className="evaluation-panel flex flex-col gap-6">
                      {sub.status === 'evaluated' ? (
                        <div className="p-6 border border-[#00d4aa] bg-[#00d4aa]/10">
                          <div className="text-[#00d4aa] text-[11px] uppercase tracking-wider mb-2 font-bold">Already Evaluated</div>
                          <div className="text-4xl text-[#e8ff47] mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                            Score: {Math.round(sub.evaluation?.score || 0)}
                          </div>
                          <p className="text-sm text-[#e8e8f0] italic leading-relaxed">"{sub.evaluation?.feedback}"</p>
                        </div>
                      ) : (
                        <>
                          <div className="bg-[#1a1a24] p-6 border border-[#2a2a3c]">
                            <div className="text-sm font-bold mb-4 text-[#e8e8f0]">Option 1: AI Evaluation</div>
                            <p className="text-xs text-[#5a5a7a] mb-4">Use Gemini to automatically evaluate and score this submission based on the competition's criteria.</p>
                            <button
                              className="btn-primary w-full text-[11px] py-3 opacity-90 hover:opacity-100"
                              onClick={() => handleTriggerAI(sub.id)}
                              disabled={isTriggering || !!evaluatingSubId}
                            >
                              {isTriggering ? 'Running AI...' : 'Trigger GenAI Evaluation'}
                            </button>
                          </div>

                          <div className="bg-[#1a1a24] p-6 border border-[#2a2a3c]">
                            <div className="text-sm font-bold mb-4 text-[#e8e8f0]">Option 2: Manual Scoring</div>
                            <div className="mb-4">
                              <label className="text-[11px] uppercase tracking-wider text-[#5a5a7a] block mb-2">Score (0-100)</label>
                              <input
                                type="number"
                                className="form-input w-full px-4 py-2 bg-[#0d0d12] border border-[#1e1e2e] text-[#e8e8f0] focus:border-[#e8ff47] outline-none"
                                value={manualScore}
                                onChange={(e) => setManualScore(e.target.value)}
                              />
                            </div>
                            <div className="mb-4">
                              <label className="text-[11px] uppercase tracking-wider text-[#5a5a7a] block mb-2">Feedback</label>
                              <textarea
                                className="form-textarea w-full h-24 p-4 bg-[#0d0d12] border border-[#1e1e2e] text-[#e8e8f0] focus:border-[#e8ff47] outline-none"
                                value={manualFeedback}
                                onChange={(e) => setManualFeedback(e.target.value)}
                              ></textarea>
                            </div>
                            <button
                              className="w-full bg-[#1e1e2e] hover:bg-[#ff4757] hover:border-[#ff4757] text-[#e8e8f0] py-3 uppercase tracking-wider text-[11px] font-bold transition-all border border-[#2a2a3c]"
                              onClick={() => handleManualEval(sub.id)}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Saving...' : 'Submit Manual Score'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* EVALUATION OVERLAY */}
      {evaluatingSubId && (
        <div className="fixed inset-0 z-[1000] bg-[#060608]/90 backdrop-blur-md flex flex-col items-center justify-center p-12 overflow-hidden">
          <div className="relative w-full max-w-[600px] text-center">
            <div className="mb-12">
              <div className="text-[#e8ff47] text-[11px] tracking-[0.4em] uppercase mb-4 animate-pulse">
                AI Evaluation Agent Active
              </div>
              <div className="text-5xl text-white leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                SCANNIG<br />CONTENT...
              </div>
            </div>

            <div className="w-full h-[1px] bg-[#1e1e2e] relative overflow-hidden mb-12">
              <div className="absolute inset-y-0 left-0 w-1/3 bg-[#e8ff47] animate-loading-scan"></div>
            </div>

            <div className="grid grid-cols-1 align-center justify-center gap-4">
              <div className="p-6 border border-[#1e1e2e] bg-[#0d0d12]/50">
                <div className="text-[10px] text-[#5a5a7a] uppercase tracking-widest mb-3">AI Processing Pipeline</div>
                <div className="flex flex-col gap-2 items-start font-mono text-[10px]">
                  <div className="flex gap-4">
                    <span className="text-[#00d4aa]">[OK]</span>
                    <span className="text-[#cecede]">Retrieving Submission #{evaluatingSubId}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-[#00d4aa]">[OK]</span>
                    <span className="text-[#cecede]">Injecting Competition Guidelines</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-yellow-400 animate-pulse">[BUSY]</span>
                    <span className="text-[#cecede]">Analyzing tone, grammar and coherence...</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-[#5a5a7a]">[WAIT]</span>
                    <span className="text-[#5a5a7a]">Generating final score and feedback</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-[#5a5a7a] text-[10px] uppercase tracking-widest">
              Please wait • Gemini-2.5-Flash
            </div>
          </div>

          {/* BACKGROUND DECORATION */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#e8ff47] rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00d4aa] rounded-full blur-[150px] animate-pulse"></div>
          </div>
        </div>
      )}
    </div>
  );
}
