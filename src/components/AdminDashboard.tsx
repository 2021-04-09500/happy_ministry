import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  FileText,
  Headphones,
  Loader2,
  Mic,
  Square,
  UploadCloud,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import type { Lang } from '../i18n';
import RichTextEditor from './RichTextEditor';

interface Post {
  id: string;
  title: string;
  content: string | null;
  audio_url: string | null;
  author: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  title_en?: string | null;
  title_sw?: string | null;
  content_en?: string | null;
  content_sw?: string | null;
  source_language?: string | null;
}

interface AdminPostsTx {
  myPosts: string;
  deleteConfirm: string;
  noPosts: string;
  audioUrl: string;
  audioUrlPlaceholder: string;
  audioUrlHelp: string;
  isPublished: string;
  isDraft: string;
  cancel: string;
  updating: string;
  creating: string;
  update: string;
  publish: string;
  saveDraft: string;
  published: string;
  draft: string;
}

interface AdminTx {
  heading: string;
  welcomeBack: string;
  newPost: string;
  editPost: string;
  login: {
    logout: string;
  };
  posts: AdminPostsTx;
}

interface Props {
  lang: Lang;
  tx: AdminTx;
}

export default function AdminDashboard({ lang, tx }: Props) {
  const { signOut } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [sourceLang, setSourceLang] = useState<Lang>('sw');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [audioUrl, setAudioUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

    if (!error && data) {
      setPosts(data);
    }

    setLoading(false);
  };

  const resetForm = () => {
    setSourceLang('sw');
    setTitle('');
    setContent('');
    setAudioUrl('');
    setAudioFile(null);
    setRecordedBlob(null);
    setIsPublished(true);
    setEditingPost(null);
    setShowForm(false);
  };

  const handleEdit = (post: Post) => {
    const editingLang = (post.source_language as Lang) || lang || 'sw';

    setSourceLang(editingLang);
    setTitle(post.title || '');
    setContent(post.content || '');
    setAudioUrl(post.audio_url || '');
    setIsPublished(post.is_published);
    setEditingPost(post);
    setShowForm(true);
  };

  const uploadAudio = async () => {
    const source =
        audioFile ||
        (recordedBlob
            ? new File([recordedBlob], `recording-${Date.now()}.webm`, {
              type: recordedBlob.type || 'audio/webm',
            })
            : null);

    if (!source) return audioUrl;

    const originalName = source.name || `audio-${Date.now()}`;

    const allowedExtensions = ['mp3', 'm4a', 'wav', 'webm', 'ogg', 'oga', 'aac', 'mp4', 'mpeg'];
    const rawExtension = originalName.includes('.')
        ? originalName.split('.').pop()?.toLowerCase() || ''
        : '';

    let finalExtension = allowedExtensions.includes(rawExtension) ? rawExtension : '';

    if (!finalExtension) {
      if (source.type === 'audio/mp4' || source.type === 'audio/m4a' || source.type === 'video/mp4') {
        finalExtension = 'm4a';
      } else if (source.type === 'audio/wav' || source.type === 'audio/x-wav') {
        finalExtension = 'wav';
      } else if (source.type === 'audio/ogg') {
        finalExtension = 'ogg';
      } else if (source.type === 'audio/webm') {
        finalExtension = 'webm';
      } else {
        finalExtension = 'mp3';
      }
    }

    const contentType =
        {
          mp3: 'audio/mpeg',
          mpeg: 'audio/mpeg',
          m4a: 'audio/mp4',
          mp4: 'audio/mp4',
          wav: 'audio/wav',
          webm: 'audio/webm',
          ogg: 'audio/ogg',
          oga: 'audio/ogg',
          aac: 'audio/aac',
        }[finalExtension] || 'audio/mpeg';

    const safeBaseName = originalName
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9._-]/g, '')
        .toLowerCase()
        .replace(/\.[^/.]+$/, '');

    const safeName = `${safeBaseName || 'audio'}-${Date.now()}.${finalExtension}`;
    const path = `words/${crypto.randomUUID()}-${safeName}`;

    const normalizedFile = new File([source], safeName, {
      type: contentType,
    });

    const { error } = await supabase.storage.from('word-audio').upload(path, normalizedFile, {
      cacheControl: '3600',
      upsert: false,
      contentType,
    });

    if (error) throw error;

    const { data } = supabase.storage.from('word-audio').getPublicUrl(path);
    return data.publicUrl;
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunksRef.current = [];

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || 'audio/webm',
      });

      setRecordedBlob(blob);
      setAudioFile(null);
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const finalAudioUrl = await uploadAudio();

      const cleanTitle = title.trim();
      const cleanContent = content.trim();

      const payload = {
        title: cleanTitle,
        content: cleanContent || null,
        title_en: sourceLang === 'en' ? cleanTitle : null,
        title_sw: sourceLang === 'sw' ? cleanTitle : null,
        content_en: sourceLang === 'en' ? cleanContent || null : null,
        content_sw: sourceLang === 'sw' ? cleanContent || null : null,
        source_language: sourceLang,
        audio_url: finalAudioUrl || null,
        is_published: isPublished,
      };

      if (editingPost) {
        const { error } = await supabase
            .from('posts')
            .update(payload)
            .eq('id', editingPost.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('posts').insert(payload);

        if (error) throw error;
      }

      await fetchPosts();
      resetForm();
    } catch (error) {
      console.error('Failed to save post', error);
      alert(
          lang === 'sw'
              ? 'Imeshindikana kuhifadhi. Tafadhali jaribu tena.'
              : 'Failed to save. Please try again.'
      );
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tx.posts.deleteConfirm)) return;

    setDeleting(id);

    await supabase.from('posts').delete().eq('id', id);
    setPosts(posts.filter((p) => p.id !== id));

    setDeleting(null);
  };

  const handlePublishDraft = async (id: string) => {
    const { error } = await supabase
        .from('posts')
        .update({ is_published: true })
        .eq('id', id);

    if (error) {
      alert(lang === 'sw' ? 'Imeshindikana kuchapisha drafti.' : 'Failed to publish draft.');
      return;
    }

    await fetchPosts();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPostTitle = (post: Post) => post.title;

  return (
      <div className="min-h-screen bg-[#fafaf8]">
        <header className="relative overflow-hidden bg-[#1a1a1a] text-white px-4 sm:px-6 py-6 shadow-lg border-b border-[#F5A623]/20">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#F5A623]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F5A623]/50 to-transparent" />

          <div className="relative max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#F5A623]/15 border border-[#F5A623]/35 flex items-center justify-center shadow-inner flex-shrink-0">
                <FileText className="text-[#F5A623]" size={22} />
              </div>

              <div className="min-w-0">
                <p className="text-[#F5A623] text-[11px] font-bold tracking-[0.25em] uppercase mb-1">
                  Happy Ministry
                </p>

                <h1 className="text-xl sm:text-2xl font-bold leading-tight truncate">
                  {tx.heading}
                </h1>

                <p className="text-white/55 text-sm mt-1 truncate">
                  {tx.welcomeBack}
                </p>
              </div>
            </div>

            <button
                onClick={signOut}
                className="flex-shrink-0 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white/75 hover:text-white hover:border-[#F5A623]/50 hover:bg-[#F5A623]/10 transition-all"
            >
              {tx.login.logout}
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">{tx.posts.myPosts}</h2>

            <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="inline-flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#E8920A] text-white font-semibold px-4 py-2 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 w-fit self-start sm:self-auto"
            >
              <Plus size={17} />
              <span className="text-sm">{tx.newPost}</span>
            </button>
          </div>

          {showForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#1a1a1a]">
                      {editingPost ? tx.editPost : tx.newPost}
                    </h3>

                    <button
                        onClick={resetForm}
                        className="text-[#999] hover:text-[#333] transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                        Original Language
                      </label>

                      <select
                          value={sourceLang}
                          onChange={(e) => setSourceLang(e.target.value as Lang)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] transition-all bg-white"
                      >
                        <option value="sw">Swahili</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                        {sourceLang === 'sw' ? 'Kichwa cha Ujumbe *' : 'Post Title *'}
                      </label>

                      <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder={sourceLang === 'sw' ? 'Weka kichwa cha ujumbe' : 'Enter post title'}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                        {sourceLang === 'sw' ? 'Ujumbe' : 'Message'}
                      </label>

                      <RichTextEditor
                          value={content}
                          onChange={setContent}
                          placeholder={sourceLang === 'sw' ? 'Andika ujumbe hapa...' : 'Write the message here...'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                        {tx.posts.audioUrl}
                      </label>

                      <input
                          type="url"
                          value={audioUrl}
                          onChange={(e) => setAudioUrl(e.target.value)}
                          placeholder={tx.posts.audioUrlPlaceholder}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] transition-all"
                      />

                      <p className="text-xs text-[#999] mt-1">{tx.posts.audioUrlHelp}</p>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-[#F5A623]/50 rounded-xl text-[#666] hover:bg-[#F5A623]/5 transition-all cursor-pointer text-sm font-medium">
                          <UploadCloud size={18} className="text-[#F5A623]" />

                          {audioFile ? audioFile.name : lang === 'sw' ? 'Pakia sauti' : 'Upload audio'}

                          <input
                              type="file"
                              accept="audio/*,*/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                if (!file) return;

                                setAudioFile(file);
                                setRecordedBlob(null);
                              }}
                          />
                        </label>

                        <button
                            type="button"
                            onClick={recording ? stopRecording : startRecording}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                recording
                                    ? 'bg-red-50 text-red-600 border border-red-100'
                                    : 'bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20 hover:bg-[#F5A623]/15'
                            }`}
                        >
                          {recording ? <Square size={17} /> : <Mic size={17} />}

                          {recording
                              ? lang === 'sw'
                                  ? 'Simamisha kurekodi'
                                  : 'Stop recording'
                              : recordedBlob
                                  ? lang === 'sw'
                                      ? 'Rekodi upya'
                                      : 'Record again'
                                  : lang === 'sw'
                                      ? 'Rekodi sauti'
                                      : 'Record voice'}
                        </button>
                      </div>

                      {recordedBlob && (
                          <audio
                              controls
                              className="w-full mt-3 h-12"
                              src={URL.createObjectURL(recordedBlob)}
                          />
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <button
                          type="button"
                          onClick={resetForm}
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-[#666] font-medium hover:bg-gray-50 transition-all"
                      >
                        {tx.posts.cancel}
                      </button>

                      {!editingPost && (
                          <button
                              type="button"
                              disabled={saving || !title.trim()}
                              onClick={async () => {
                                setIsPublished(false);
                                setTimeout(() => {
                                  document.querySelector<HTMLFormElement>('form')?.requestSubmit();
                                }, 0);
                              }}
                              className="flex-1 px-4 py-3 border border-[#F5A623] text-[#F5A623] font-bold rounded-xl hover:bg-[#F5A623]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {lang === 'sw' ? 'Hifadhi kama Drafti' : 'Save as Draft'}
                          </button>
                      )}

                      {editingPost && !editingPost.is_published && (
                          <button
                              type="button"
                              disabled={saving || !title.trim()}
                              onClick={async () => {
                                setIsPublished(false);
                                setTimeout(() => {
                                  document.querySelector<HTMLFormElement>('form')?.requestSubmit();
                                }, 0);
                              }}
                              className="flex-1 px-4 py-3 border border-[#F5A623] text-[#F5A623] font-bold rounded-xl hover:bg-[#F5A623]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {lang === 'sw' ? 'Hifadhi Drafti' : 'Save Draft'}
                          </button>
                      )}

                      <button
                          type="button"
                          disabled={saving || !title.trim()}
                          onClick={async () => {
                            setIsPublished(true);
                            setTimeout(() => {
                              document.querySelector<HTMLFormElement>('form')?.requestSubmit();
                            }, 0);
                          }}
                          className="flex-1 bg-[#F5A623] hover:bg-[#E8920A] disabled:bg-[#F5A623]/60 text-white font-bold py-3 rounded-xl transition-all shadow-md disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {saving ? (
                            <>
                              <Loader2 className="animate-spin" size={18} />
                              {editingPost ? tx.posts.updating : tx.posts.creating}
                            </>
                        ) : editingPost ? (
                            editingPost.is_published ? (
                                lang === 'sw' ? 'Sasisha Chapisho' : 'Update Post'
                            ) : lang === 'sw' ? (
                                'Chapisha Drafti'
                            ) : (
                                'Publish Draft'
                            )
                        ) : lang === 'sw' ? (
                            'Chapisha'
                        ) : (
                            'Publish'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
          )}

          {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-[#F5A623]" size={32} />
              </div>
          ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <FileText className="mx-auto text-[#999] mb-4" size={48} />
                <p className="text-[#666]">{tx.posts.noPosts}</p>
              </div>
          ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                      <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              post.is_published
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        {post.is_published ? tx.posts.published : tx.posts.draft}
                      </span>

                            {post.audio_url && <Headphones className="text-[#F5A623]" size={16} />}
                          </div>

                          <h4 className="font-semibold text-[#1a1a1a] truncate">
                            {getPostTitle(post)}
                          </h4>

                          <p className="text-sm text-[#999] mt-1">{formatDate(post.created_at)}</p>
                        </div>

                        <div className="flex gap-2 flex-shrink-0 self-end sm:self-auto">
                          {!post.is_published && (
                              <button
                                  onClick={() => handlePublishDraft(post.id)}
                                  className="px-3 py-2 text-sm text-white bg-[#F5A623] hover:bg-[#E8920A] rounded-lg transition-all"
                              >
                                {lang === 'sw' ? 'Chapisha' : 'Publish'}
                              </button>
                          )}

                          <button
                              onClick={() => handleEdit(post)}
                              className="p-2 text-[#666] hover:text-[#F5A623] hover:bg-[#F5A623]/10 rounded-lg transition-all"
                          >
                            <Edit2 size={18} />
                          </button>

                          <button
                              onClick={() => handleDelete(post.id)}
                              disabled={deleting === post.id}
                              className="p-2 text-[#666] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                          >
                            {deleting === post.id ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
          )}
        </main>
      </div>
  );
}