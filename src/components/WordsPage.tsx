import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Calendar,
  MessageCircle,
  Play,
  Clock,
  Send,
  Loader2,
  Smile,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Lang } from '../i18n';

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface ReactionCount {
  emoji: string;
  count: number;
}

interface Post {
  id: string;
  title: string;
  content: string | null;
  title_en?: string | null;
  title_sw?: string | null;
  content_en?: string | null;
  content_sw?: string | null;
  audio_url: string | null;
  author: string;
  created_at: string;
  comments?: Comment[];
  reaction_counts?: ReactionCount[];
  user_reactions?: string[];
}

interface WordsTx {
  eyebrow: string;
  heading: string;
  subheading: string;
  searchPlaceholder: string;
  clearFilters: string;
  noPosts: string;
  postedBy: string;
  readMore: string;
  reactions: string;
  react: string;
  comments: string;
  noComments: string;
  yourName: string;
  commentPlaceholder: string;
  submitComment: string;
}

interface Props {
  lang: Lang;
  tx: WordsTx;
  latestOnly?: boolean;
  onViewAll?: () => void;
}

const REACTION_EMOJIS = ['❤️', '🙏', '✝️', '🔥', '🙌', '💪'];

function getSessionId() {
  let sessionId = sessionStorage.getItem('hm_session_id');

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('hm_session_id', sessionId);
  }

  return sessionId;
}

export default function WordsPage({ lang, tx, latestOnly = false, onViewAll }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentName, setCommentName] = useState('');
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [viewingReaction, setViewingReaction] = useState<{
    postId: string;
    emoji: string;
  } | null>(null);
  const reactionRef = useRef<HTMLDivElement>(null);
  const sessionId = getSessionId();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (reactionRef.current && !reactionRef.current.contains(e.target as Node)) {
        setShowReactions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [search, dateFilter, latestOnly]);

  const getPostTitle = (post: Post) => post.title;

  const getPostContent = (post: Post) => post.content;

  const fetchPosts = async () => {
    setLoading(true);

    let query = supabase
        .from('posts')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    if (latestOnly) {
      query = query.limit(1);
    }

    if (!latestOnly && dateFilter) {
      const start = new Date(dateFilter);
      start.setHours(0, 0, 0, 0);

      const end = new Date(dateFilter);
      end.setHours(23, 59, 59, 999);

      query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
    }

    const { data } = await query;
    let filteredData = (data || []) as Post[];

    if (!latestOnly && search) {
      const searchLower = search.toLowerCase();

      filteredData = filteredData.filter((post) => {
        const title = getPostTitle(post).toLowerCase();
        const content = getPostContent(post)?.toLowerCase() || '';

        return title.includes(searchLower) || content.includes(searchLower);
      });
    }

    const postsWithExtras = await Promise.all(
        filteredData.map(async (post) => {
          const [reactionsRes, commentsRes, userReactionsRes] = await Promise.all([
            supabase.from('reactions').select('emoji').eq('post_id', post.id),
            supabase
                .from('comments')
                .select('*')
                .eq('post_id', post.id)
                .order('created_at', { ascending: true }),
            supabase
                .from('reactions')
                .select('emoji')
                .eq('post_id', post.id)
                .eq('session_id', sessionId),
          ]);

          const reactionCounts: ReactionCount[] = [];
          const emojiCounts: Record<string, number> = {};

          (reactionsRes.data || []).forEach((reaction: { emoji: string }) => {
            emojiCounts[reaction.emoji] = (emojiCounts[reaction.emoji] || 0) + 1;
          });

          Object.entries(emojiCounts).forEach(([emoji, count]) => {
            reactionCounts.push({ emoji, count });
          });

          return {
            ...post,
            comments: commentsRes.data || [],
            reaction_counts: reactionCounts,
            user_reactions: (userReactionsRes.data || []).map(
                (reaction: { emoji: string }) => reaction.emoji
            ),
          };
        })
    );

    setPosts(postsWithExtras);
    setLoading(false);
  };

  const handleReaction = async (postId: string, emoji: string) => {
    const userReactions = posts.find((post) => post.id === postId)?.user_reactions || [];

    if (userReactions.includes(emoji)) {
      await supabase
          .from('reactions')
          .delete()
          .eq('post_id', postId)
          .eq('session_id', sessionId)
          .eq('emoji', emoji);
    } else {
      await supabase.from('reactions').insert({
        post_id: postId,
        emoji,
        session_id: sessionId,
      });
    }

    fetchPosts();
  };

  const handleSubmitComment = async (postId: string) => {
    if (!commentText.trim() || !commentName.trim()) return;

    setSubmittingComment(postId);

    await supabase.from('comments').insert({
      post_id: postId,
      author_name: commentName.trim(),
      content: commentText.trim(),
    });

    setCommentText('');
    setCommentName('');
    setSubmittingComment(null);
    fetchPosts();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString(lang === 'sw' ? 'sw-TZ' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
      <section id="words" className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <p className="text-[#F5A623] font-semibold tracking-widest text-sm uppercase mb-3">
              {latestOnly ? (lang === 'sw' ? 'NENO LA LEO' : "TODAY'S WORD") : tx.eyebrow}
            </p>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4">
              {latestOnly ? (lang === 'sw' ? 'Neno la Karibuni' : 'Latest Word') : tx.heading}
            </h2>

            <div className="divider-cross text-[#F5A623] max-w-xs mx-auto">
              <span className="text-2xl">&#10011;</span>
            </div>

            <p className="text-[#666] mt-6 max-w-md mx-auto">
              {latestOnly
                  ? lang === 'sw'
                      ? 'Neno la Mungu ni taa na mwanga wa njia zetu, litumulikao katika safari zetu.'
                      : 'The word of God is a lamp and a light for our path, shining upon us throughout our journey.'
                  : tx.subheading}
            </p>
          </div>

          {!latestOnly && (
              <div className="bg-[#fafaf8] rounded-2xl p-4 sm:p-6 mb-8 border border-gray-100">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]"
                        size={18}
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={tx.searchPlaceholder}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] transition-all bg-white"
                    />
                  </div>

                  <div className="relative">
                    <Calendar
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]"
                        size={18}
                    />

                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full sm:w-auto pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] transition-all bg-white"
                    />
                  </div>

                  {(search || dateFilter) && (
                      <button
                          onClick={() => {
                            setSearch('');
                            setDateFilter('');
                          }}
                          className="text-sm text-[#F5A623] hover:underline whitespace-nowrap self-center"
                      >
                        {tx.clearFilters}
                      </button>
                  )}
                </div>
              </div>
          )}

          {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-[#F5A623]" size={32} />
              </div>
          ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-[#fafaf8] rounded-2xl">
                <MessageCircle className="mx-auto text-[#ccc] mb-4" size={48} />
                <p className="text-[#666]">{tx.noPosts}</p>
              </div>
          ) : (
              <div className="space-y-6">
                {posts.map((post) => {
                  const postTitle = getPostTitle(post);
                  const postContent = getPostContent(post);

                  return (
                      <article
                          key={post.id}
                          className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${
                              latestOnly ? 'animate-fadeInUp ring-1 ring-[#F5A623]/10 shadow-xl' : ''
                          }`}
                      >
                        <div className="p-5 sm:p-6 border-b border-gray-100">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg sm:text-xl font-bold text-[#1a1a1a] mb-2" translate='yes'>
                                {postTitle}
                              </h3>

                              <div className="flex flex-wrap gap-3 text-sm text-[#999]">
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} />
                            {formatDate(post.created_at)} • {formatTime(post.created_at)}
                          </span>

                                <span className="flex items-center gap-1.5">
                            {tx.postedBy} {post.author}
                          </span>
                              </div>
                            </div>

                            {post.audio_url && (
                                <div className="flex-shrink-0 w-10 h-10 bg-[#F5A623]/10 rounded-full flex items-center justify-center">
                                  <Play className="text-[#F5A623]" size={18} />
                                </div>
                            )}
                          </div>
                        </div>

                        {post.audio_url && (
                            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-[#fafaf8] to-white border-b border-gray-100">
                              <audio controls className="w-full h-12" preload="metadata">
                                <source src={post.audio_url} type="audio/mpeg" />
                              </audio>
                            </div>
                        )}

                        {postContent && (
                            <div className="px-5 sm:px-6 py-4">
                              <p
                                  translate="yes"
                                  className={`text-[#444] leading-relaxed whitespace-pre-wrap ${
                                      expandedPost === post.id ? '' : 'line-clamp-4'
                                  }`}
                              >
                                {postContent}
                              </p>

                              {postContent.length > 200 && expandedPost !== post.id && (
                                  <button
                                      onClick={() => setExpandedPost(post.id)}
                                      className="text-[#F5A623] text-sm font-medium mt-2 hover:underline"
                                  >
                                    {tx.readMore}
                                  </button>
                              )}
                            </div>
                        )}

                        <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
                          <span className="text-sm text-[#666]">{tx.reactions}:</span>

                          <div className="flex flex-wrap gap-2">
                            {post.reaction_counts?.map((reaction) => (
                                <button
                                    key={reaction.emoji}
                                    onClick={() =>
                                        setViewingReaction(
                                            viewingReaction?.postId === post.id && viewingReaction?.emoji === reaction.emoji
                                                ? null
                                                : { postId: post.id, emoji: reaction.emoji }
                                        )
                                    }
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all ${
                                        post.user_reactions?.includes(reaction.emoji)
                                            ? 'bg-[#F5A623] text-white'
                                            : 'bg-gray-100 hover:bg-gray-200 text-[#444]'
                                    }`}
                                >
                                  <span>{reaction.emoji}</span>
                                  <span>{reaction.count}</span>
                                </button>
                            ))}
                          </div>

                          {viewingReaction?.postId === post.id && (
                              <div className="w-full mt-2 bg-[#fafaf8] border border-gray-100 rounded-xl px-4 py-3 text-sm text-[#666]">
                                {(() => {
                                  const reaction = post.reaction_counts?.find(
                                      (item) => item.emoji === viewingReaction.emoji
                                  );

                                  const count = reaction?.count || 0;

                                  return (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xl">{viewingReaction.emoji}</span>
                                        <span>
            {lang === 'sw'
                ? `${count} ${count === 1 ? 'mtu ameweka mwitikio huu' : 'watu wameweka mwitikio huu'}`
                : `${count} ${count === 1 ? 'person reacted with this' : 'people reacted with this'}`}
          </span>
                                      </div>
                                  );
                                })()}
                              </div>
                          )}

                          <div className="relative" ref={showReactions === post.id ? reactionRef : null}>
                            <button
                                onClick={() =>
                                    setShowReactions(showReactions === post.id ? null : post.id)
                                }
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-[#666] hover:border-[#F5A623] hover:text-[#F5A623] transition-all"
                            >
                              <Smile size={16} />
                              {tx.react}
                            </button>

                            {showReactions === post.id && (
                                <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex gap-1 z-10">
                                  {REACTION_EMOJIS.map((emoji) => (
                                      <button
                                          key={emoji}
                                          onClick={() => {
                                            handleReaction(post.id, emoji);
                                            setShowReactions(null);
                                          }}
                                          className={`w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all text-xl ${
                                              post.user_reactions?.includes(emoji) ? 'bg-[#F5A623]/10' : ''
                                          }`}
                                      >
                                        {emoji}
                                      </button>
                                  ))}
                                </div>
                            )}
                          </div>

                          <button
                              onClick={() => setShowComments(showComments === post.id ? null : post.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-[#666] hover:border-[#F5A623] hover:text-[#F5A623] transition-all"
                          >
                            <MessageCircle size={16} />
                            {tx.comments} ({post.comments?.length || 0})
                          </button>
                        </div>

                        {showComments === post.id && (
                            <div className="px-5 sm:px-6 py-4 bg-[#fafaf8]">
                              {post.comments && post.comments.length > 0 ? (
                                  <div className="space-y-3 mb-4">
                                    {post.comments.map((comment) => (
                                        <div
                                            key={comment.id}
                                            className="bg-white rounded-xl p-4 border border-gray-100"
                                        >
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-[#F5A623]/20 rounded-full flex items-center justify-center text-sm font-semibold text-[#F5A623]">
                                              {comment.author_name.charAt(0).toUpperCase()}
                                            </div>

                                            <div>
                                              <p className="font-medium text-[#1a1a1a] text-sm">
                                                {comment.author_name}
                                              </p>

                                              <p className="text-xs text-[#999]">
                                                {formatDate(comment.created_at)} {formatTime(comment.created_at)}
                                              </p>
                                            </div>
                                          </div>

                                          <p className="text-[#444] text-sm whitespace-pre-wrap">
                                            {comment.content}
                                          </p>
                                        </div>
                                    ))}
                                  </div>
                              ) : (
                                  <p className="text-sm text-[#999] mb-4">{tx.noComments}</p>
                              )}

                              <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
                                <input
                                    type="text"
                                    value={commentName}
                                    onChange={(e) => setCommentName(e.target.value)}
                                    placeholder={tx.yourName}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623]"
                                />

                                <textarea
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder={tx.commentPlaceholder}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] resize-none"
                                />

                                <button
                                    onClick={() => handleSubmitComment(post.id)}
                                    disabled={
                                        submittingComment === post.id ||
                                        !commentText.trim() ||
                                        !commentName.trim()
                                    }
                                    className="flex items-center gap-2 bg-[#F5A623] hover:bg-[#E8920A] disabled:bg-[#F5A623]/50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all disabled:cursor-not-allowed"
                                >
                                  {submittingComment === post.id ? (
                                      <Loader2 className="animate-spin" size={16} />
                                  ) : (
                                      <Send size={16} />
                                  )}

                                  {tx.submitComment}
                                </button>
                              </div>
                            </div>
                        )}
                      </article>
                  );
                })}
              </div>
          )}

          {latestOnly && posts.length > 0 && onViewAll && (
              <div className="text-center mt-8">
                <button
                    onClick={onViewAll}
                    className="bg-[#F5A623] hover:bg-[#E8920A] text-white font-semibold px-8 py-3 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  {lang === 'sw' ? 'Tazama Mafundisho na Jumbe Zote' : 'View All Teachings & Messages'}
                </button>
              </div>
          )}
        </div>
      </section>
  );
}