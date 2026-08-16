import { useRef, useState } from 'react';
import { FileText, Upload, Sparkles, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api, getToken } from '../lib/api';
import { PageLoader, Card, Badge, EmptyState, ConfirmModal, ErrorBanner } from '../components/UI';
import { useAsync } from '../components/UI';
import { fmtDate, timeAgo, fmtTime } from '../lib/format';

export default function Resumes() {
  const { data, loading, reload } = useAsync(() => api.get('/resumes'));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const fileRef = useRef(null);

  if (loading) return <PageLoader />;

  const resumes = data?.resumes || [];
  const active = resumes.find((r) => r.isPrimary) || resumes[0];

  const upload = async (file) => {
    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('resume', file);
      const res = await fetch('/api/resumes/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Upload failed');
      }
      reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const analyze = async (id) => {
    setAnalyzing(id);
    try {
      await api.post(`/resumes/${id}/analyze`);
      reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalyzing(null);
    }
  };

  const remove = async (id) => {
    await api.delete(`/resumes/${id}`);
    reload();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Resumes</h1>
          <p className="page-subtitle">Upload your resume and let AI analyze it against opportunities.</p>
        </div>
        <button className="btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload size={16} /> {uploading ? 'Uploading…' : 'Upload resume'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) upload(e.target.files[0]);
            e.target.value = '';
          }}
        />
      </div>

      <ErrorBanner error={error} />

      {resumes.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No resumes yet"
            message="Upload your resume (PDF) to get AI-powered analysis: skill extraction, ATS feedback, and fit scores for opportunities."
            action={
              <button className="btn-primary" onClick={() => fileRef.current?.click()}>
                <Upload size={16} /> Upload your first resume
              </button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {resumes.map((r) => (
            <Card key={r._id}>
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                  <FileText size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900">{r.filename}</h3>
                    {active?._id === r._id ? <Badge className="bg-emerald-100 text-emerald-700">Active</Badge> : null}
                    {r.analysis ? <Badge className="bg-violet-100 text-violet-700">Analyzed</Badge> : null}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {Math.round(r.fileSize / 1024)} KB · {r.fileType} · uploaded {timeAgo(r.createdAt)}
                  </p>

                  {r.analysis ? (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5">
                        <p className="text-xs text-slate-400">Overall score</p>
                        <p className={`text-lg font-bold ${r.analysis.overallScore >= 70 ? 'text-emerald-600' : r.analysis.overallScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {r.analysis.overallScore ?? 0}/100
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5">
                        <p className="text-xs text-slate-400">Skills found</p>
                        <p className="text-lg font-bold text-slate-800">{r.analysis.parsed?.skills?.length ?? 0}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5">
                        <p className="text-xs text-slate-400">Missing keywords</p>
                        <p className="text-lg font-bold text-amber-600">{r.analysis.missingKeywords?.length ?? 0}</p>
                      </div>
                    </div>
                  ) : null}

                  {r.analysis?.summary ? (
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">{r.analysis.summary}</p>
                  ) : null}

                  {r.analysis?.parsed?.skills?.length ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {r.analysis.parsed.skills.slice(0, 10).map((s) => (
                        <span key={s} className="text-[11px] bg-brand-50 text-brand-700 rounded-md px-2 py-0.5">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {r.analysis?.missingKeywords?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.analysis.missingKeywords.slice(0, 6).map((s) => (
                        <span key={s} className="text-[11px] bg-amber-50 text-amber-700 border border-amber-100 rounded-md px-2 py-0.5">
                          + {s}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                    <a href={`/uploads/${r.filePath}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                      View file
                    </a>
                    {!r.analysis ? (
                      <button onClick={() => analyze(r._id)} disabled={analyzing === r._id} className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 disabled:opacity-50">
                        <Sparkles size={13} /> {analyzing === r._id ? 'Analyzing…' : 'Run AI analysis'}
                      </button>
                    ) : null}
                    <button onClick={() => setConfirm(r)} className="ml-auto p-1 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition" aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm._id)}
        title="Delete resume?"
        message={confirm ? `Delete "${confirm.filename}"?` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
