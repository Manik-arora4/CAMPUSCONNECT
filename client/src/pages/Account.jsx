import { useState, useRef } from 'react';
import { Save, UserCircle2, CheckCircle2, Camera } from 'lucide-react';
import { api } from '../lib/api';
import { Card, Field, ErrorBanner, Avatar } from '../components/UI';
import PulsatingButton from '../components/PulsatingButton';
import { useAuth } from '../context/AuthContext';

export default function Account() {
  const { user, refreshMe } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', designation: user?.designation || '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await api.postForm('/users/avatar', formData);
      await refreshMe();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.patch('/users/me', form);
      await refreshMe();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-title">Account</h1>
        <p className="page-subtitle">Manage your basic account details.</p>
      </div>

      <Card className="flex items-center gap-4">
        <div className="relative group">
          <Avatar name={user?.name} size="lg" src={user?.avatar} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
            disabled={uploadingAvatar}
          >
            <Camera size={22} className="text-white" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <div>
          <p className="font-semibold text-slate-900">{user?.name}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <p className="text-xs text-slate-400 capitalize mt-0.5">{user?.role} · {user?.designation || 'Member'}</p>
          <p className="text-xs text-slate-400 mt-1">{uploadingAvatar ? 'Uploading…' : 'Hover to change photo'}</p>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <UserCircle2 size={18} className="text-brand-600" /> Edit details
        </h3>
        <ErrorBanner error={error} />
        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name">
            <input className="input" value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Phone">
            <input className="input" value={form.phone} onChange={set('phone')} placeholder="+91 …" />
          </Field>
          {user?.role === 'faculty' ? (
            <Field label="Designation">
              <input className="input" value={form.designation} onChange={set('designation')} placeholder="Assistant Professor" />
            </Field>
          ) : null}
          <div className="flex items-center gap-3">
            <PulsatingButton type="submit" disabled={saving}>
              <Save size={16} /> {saving ? 'Saving…' : 'Save changes'}
            </PulsatingButton>
            {saved ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <CheckCircle2 size={16} /> Saved!
              </span>
            ) : null}
          </div>
        </form>
      </Card>
    </div>
  );
}
