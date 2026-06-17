import { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  BookOpen,
  Heart,
  Star,
  Users,
  ChevronDown,
  Globe,
} from 'lucide-react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import WordsPage from './components/WordsPage';
import { t, type Lang } from './i18n';

function useIntersection(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setVisible(true);
        },
        { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useIntersection();
  return (
      <div
          ref={ref}
          className={`transition-all duration-700 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          } ${className}`}
      >
        {children}
      </div>
  );
}

const PILLAR_ICONS = [<BookOpen size={22} />, <Heart size={22} />, <Star size={22} />];
const MISSION_ICONS = [<BookOpen size={32} />, <Heart size={32} />, <Star size={32} />];

type View = 'main' | 'admin' | 'login' | 'words' | 'single-word';

function MainContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const getInitialLang = (): Lang => {
    const browserLang = navigator.language.toLowerCase();

    if (browserLang.startsWith('sw')) {
      return 'sw';
    }

    return 'en';
  };

  const [lang, setLang] = useState<Lang>(getInitialLang);
  const [view, setView] = useState<View>('main');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const tx = t[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: tx.nav.about, href: '#about' },
    { label: tx.nav.mission, href: '#mission' },
    { label: tx.nav.words, href: '#words', view: 'words' as const },
    { label: tx.nav.location, href: '#location' },
    { label: tx.nav.contact, href: '#contact' },
  ];

  function LanguageToggle({ compact = false }: { compact?: boolean }) {
    return (
        <button
            onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
            className={`flex items-center gap-1.5 font-semibold text-xs tracking-widest uppercase transition-all rounded-full border ${
                compact
                    ? 'px-3 py-1.5 border-gray-200 text-[#333] hover:border-[#F5A623] hover:text-[#F5A623]'
                    : scrolled
                        ? 'px-3 py-1.5 border-[#333]/30 text-[#333] hover:border-[#F5A623] hover:text-[#F5A623]'
                        : 'px-3 py-1.5 border-white/40 text-white hover:border-[#F5A623] hover:text-[#F5A623]'
            }`}
            aria-label="Switch language"
        >
          <Globe size={13} />
          {lang === 'en' ? 'SW' : 'EN'}
        </button>
    );
  }

  if (view === 'login') {
    return (
        <>
          <button
              onClick={() => setView('main')}
              className="fixed top-4 left-4 z-50 flex items-center gap-2 text-white bg-[#1a1a1a]/50 hover:bg-[#1a1a1a] px-4 py-2 rounded-xl transition-all"
          >
            <X size={18} />
            Back
          </button>

          <AdminLogin
              lang={lang}
              tx={tx.admin.login}
              onSuccess={() => setView('admin')}
          />
        </>
    );
  }

  if (view === 'words') {
    return (
        <>
          <button
              onClick={() => setView('main')}
              className="fixed top-4 left-4 z-50 flex items-center gap-2 text-white bg-[#F5A623] hover:bg-[#E8920A] px-4 py-2 rounded-xl transition-all"
          >
            <X size={18} />
            Back to Site
          </button>

          <div className="min-h-screen bg-white pt-14">
            <WordsPage lang={lang} tx={tx.words} />
          </div>
        </>
    );
  }

  if (view === 'single-word' && selectedPostId) {
    return (
        <>
          <button
              onClick={() => setView('main')}
              className="fixed top-4 left-4 z-50 flex items-center gap-2 text-white bg-[#F5A623] hover:bg-[#E8920A] px-4 py-2 rounded-xl transition-all"
          >
            <X size={18} />
            Back to Site
          </button>

          <div className="min-h-screen bg-white pt-14">
            <WordsPage
                lang={lang}
                tx={tx.words}
                singlePostId={selectedPostId}
            />
          </div>
        </>
    );
  }

  if (view === 'admin') {
    return (
        <>
          <button
              onClick={() => setView('main')}
              className="fixed bottom-4 left-4 sm:top-4 sm:bottom-auto z-50 flex items-center gap-2 text-white bg-[#F5A623] hover:bg-[#E8920A] px-4 py-2 rounded-xl transition-all"
          >
            <X size={18} />
            Back to Site
          </button>

          <AdminDashboard lang={lang} tx={tx.admin} />
        </>
    );
  }

  return (
      <div className="min-h-screen bg-white text-[#1a1a1a]" translate={"no"}>
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled ? 'bg-white/95 backdrop-blur-sm shadow-md py-2' : 'bg-transparent py-4'
            }`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
            <a href="#" className="flex items-center gap-3 group flex-shrink-0">
              <div className="h-14 w-14 rounded-full bg-white shadow-md ring-2 ring-[#F5A623]/30 group-hover:ring-[#F5A623] transition-all flex-shrink-0 flex items-center justify-center">
                <img
                    src="/IMG-20260614-WA0011.jpg"
                    alt="Happy Ministry Logo"
                    className="w-[70%] h-[70%] object-contain"
                />
              </div>

              <span
                  className={`font-black text-base sm:text-lg tracking-wide transition-colors leading-tight ${
                      scrolled ? 'text-[#1a1a1a]' : 'text-white text-shadow'
                  }`}
                  style={{ fontFamily: 'Playfair Display, serif' }}
              >
              HAPPY MINISTRY
            </span>
            </a>

            <nav className="hidden md:flex items-center gap-5">
              {navLinks.map((link) => (
                  <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => {
                        if ('view' in link && link.view) {
                          e.preventDefault();
                          setView(link.view);
                        }
                      }}
                      className={`nav-link text-sm font-medium transition-colors ${
                          scrolled ? 'text-[#333]' : 'text-white text-shadow-sm'
                      } hover:text-[#F5A623]`}
                  >
                    {link.label}
                  </a>
              ))}

              <LanguageToggle />

              {isAdmin ? (
                  <button
                      onClick={() => setView('admin')}
                      className="bg-[#F5A623] hover:bg-[#E8920A] text-white text-sm font-semibold px-4 py-2 rounded-full transition-all shadow-md hover:shadow-lg"
                  >
                    {tx.nav.admin}
                  </button>
              ) : (
                  <button
                      onClick={() => setView('login')}
                      className={`text-sm font-medium transition-colors ${
                          scrolled ? 'text-[#333]' : 'text-white text-shadow-sm'
                      } hover:text-[#F5A623]`}
                  >
                    {tx.nav.admin}
                  </button>
              )}
            </nav>

            <div className="md:hidden flex items-center gap-2">
              <LanguageToggle />

              <button
                  className={`p-2 rounded-lg transition-colors ${
                      scrolled ? 'text-[#333]' : 'text-white'
                  }`}
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Toggle menu"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {menuOpen && (
              <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
                <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-4">
                  {navLinks.map((link) => (
                      <a
                          key={link.href}
                          href={link.href}
                          className="text-[#333] font-medium py-1 hover:text-[#F5A623] transition-colors"
                          onClick={(e) => {
                            setMenuOpen(false);
                            if ('view' in link && link.view) {
                              e.preventDefault();
                              setView(link.view);
                            }
                          }}
                      >
                        {link.label}
                      </a>
                  ))}

                  <button
                      onClick={() => {
                        setMenuOpen(false);
                        if (isAdmin) {
                          setView('admin');
                        } else {
                          setView('login');
                        }
                      }}
                      className="text-[#F5A623] font-medium py-1 text-left"
                  >
                    {tx.nav.admin}
                  </button>
                </div>
              </div>
          )}
        </header>

        <section
            className="relative min-h-screen flex flex-col items-center justify-center text-white overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #1a1a1a 0%, #2C2C2C 40%, #3a2a0a 100%)',
            }}
        >
          <div
              className="absolute inset-0 opacity-10"
              style={{
                background:
                    'repeating-conic-gradient(from 0deg at 50% 60%, #F5A623 0deg, transparent 8deg, transparent 18deg)',
              }}
          />

          <div
              className="absolute inset-0"
              style={{
                background:
                    'radial-gradient(ellipse 70% 60% at 50% 70%, rgba(245,166,35,0.18) 0%, transparent 70%)',
              }}
          />

          <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 pt-24 sm:pt-16 pb-16 animate-fadeInUp">
            <div className="pulse-glow w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-white border-4 border-[#F5A623] shadow-2xl flex items-center justify-center mb-8 flex-shrink-0">
              <img
                  src="/IMG-20260614-WA0011.jpg"
                  alt="Happy Ministry Logo"
                  className="w-[70%] h-[70%] object-contain"
              />
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-widest text-white text-shadow mb-4">
              HAPPY MINISTRY
            </h1>

            <div className="w-24 h-1 bg-[#F5A623] rounded-full mb-6 mx-auto" />

            <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-xl leading-relaxed font-light px-2 transition-all duration-500">
              {tx.hero.tagline}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0">
              <button
                  onClick={() => setView('words')}
                  className="bg-[#F5A623] hover:bg-[#E8920A] text-white font-semibold px-8 py-4 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 text-center"
              >
                {tx.nav.words}
              </button>

              <a
                  href="#contact"
                  className="border-2 border-white/50 hover:border-[#F5A623] text-white font-semibold px-8 py-4 rounded-full transition-all hover:-translate-y-1 text-center"
              >
                {tx.hero.contactUs}
              </a>
            </div>
          </div>

          <a
              href="#about"
              className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-[#F5A623] transition-colors animate-bounce"
          >
            <ChevronDown size={32} />
          </a>
        </section>

        <div className="bg-[#F5A623] py-4">
          <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-4 sm:gap-12 text-white text-sm font-semibold tracking-wide">
          <span className="flex items-center gap-2">
            <Star size={14} className="fill-white" /> {tx.banner.established}
          </span>
            <span className="flex items-center gap-2">
            <BookOpen size={14} /> {tx.banner.teachings}
          </span>
            <span className="flex items-center gap-2">
            <Users size={14} /> {tx.banner.location}
          </span>
          </div>
        </div>

        <section id="about" className="py-16 sm:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <Section>
              <div className="text-center mb-10 sm:mb-16">
                <p className="text-[#F5A623] font-semibold tracking-widest text-sm uppercase mb-3">
                  {tx.about.eyebrow}
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4">
                  {tx.about.heading}
                </h2>
                <div className="divider-cross text-[#F5A623] max-w-xs mx-auto">
                  <span className="text-2xl">&#10011;</span>
                </div>
              </div>
            </Section>

            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <Section>
                <div className="relative">
                  <div
                      className="absolute -inset-4 rounded-3xl opacity-20"
                      style={{ background: 'linear-gradient(135deg, #F5A623, #E8920A)' }}
                  />
                  <div className="relative bg-gradient-to-br from-[#fdf6e3] to-[#fef3c7] rounded-2xl p-8 border border-[#F5A623]/20 shadow-xl">
                    <BookOpen className="text-[#F5A623] mb-4" size={40} />
                    <p className="text-[#444] leading-8 text-base">
                      {tx.about.body1.split('2005')[0]}
                      <strong className="text-[#1a1a1a]">2005</strong>
                      {tx.about.body1.split('2005')[1]}
                    </p>
                    <p className="text-[#444] leading-8 text-base mt-4">{tx.about.body2}</p>
                  </div>
                </div>
              </Section>

              <Section>
                <div className="space-y-6">
                  {tx.about.pillars.map((item, i) => (
                      <div
                          key={item.title}
                          className="flex gap-4 p-5 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-[#F5A623]/30 transition-all group"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-[#F5A623]/10 rounded-full flex items-center justify-center text-[#F5A623] group-hover:bg-[#F5A623] group-hover:text-white transition-all">
                          {PILLAR_ICONS[i]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#1a1a1a] mb-1">{item.title}</h3>
                          <p className="text-[#666] text-sm leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        </section>

        <section id="mission" className="py-16 sm:py-24 bg-[#1a1a1a] relative overflow-hidden">
          <div
              className="absolute inset-0 opacity-5"
              style={{
                background:
                    'repeating-conic-gradient(from 0deg at 50% 50%, #F5A623 0deg, transparent 6deg, transparent 20deg)',
              }}
          />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <Section>
              <div className="text-center mb-16">
                <p className="text-[#F5A623] font-semibold tracking-widest text-sm uppercase mb-3">
                  {tx.mission.eyebrow}
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                  {tx.mission.heading}
                </h2>
                <div className="divider-cross text-[#F5A623] max-w-xs mx-auto">
                  <span className="text-2xl">&#10011;</span>
                </div>
              </div>
            </Section>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {tx.mission.cards.map((card, i) => (
                  <Section key={card.title}>
                    <div className="relative group h-full">
                      <div className="absolute top-0 right-4 text-7xl font-black text-white/5 leading-none select-none">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 h-full hover:bg-white/10 hover:border-[#F5A623]/40 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                        <div className="w-14 h-14 bg-[#F5A623]/15 rounded-xl flex items-center justify-center text-[#F5A623] mb-6 group-hover:bg-[#F5A623] group-hover:text-white transition-all duration-300">
                          {MISSION_ICONS[i]}
                        </div>
                        <h3 className="text-white font-bold text-xl mb-3">{card.title}</h3>
                        <p className="text-white/60 leading-relaxed text-sm">{card.desc}</p>
                      </div>
                    </div>
                  </Section>
              ))}
            </div>

            <Section>
              <div className="mt-16 text-center max-w-2xl mx-auto">
                <div className="text-[#F5A623] text-5xl font-serif leading-none mb-4">&ldquo;</div>
                <p className="text-white/80 text-xl italic leading-relaxed font-light">
                  {tx.mission.scripture}
                </p>
                <p className="text-[#F5A623] text-sm font-semibold mt-4 tracking-widest">
                  {lang === 'en' ? 'MARK 16:15' : 'MARKO 16:15'}
                </p>
              </div>
            </Section>
          </div>
        </section>

        <WordsPage
            lang={lang}
            tx={tx.words}
            latestOnly
            onViewAll={() => setView('words')}
            onOpenPost={(postId) => {
              setSelectedPostId(postId);
              setView('single-word');
            }}
        />

        <section id="location" className="py-16 sm:py-24 bg-[#fafaf8]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <Section>
              <div className="text-center mb-10 sm:mb-16">
                <p className="text-[#F5A623] font-semibold tracking-widest text-sm uppercase mb-3">
                  {tx.location.eyebrow}
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4">
                  {tx.location.heading}
                </h2>
                <div className="divider-cross text-[#F5A623] max-w-xs mx-auto">
                  <span className="text-2xl">&#10011;</span>
                </div>
              </div>
            </Section>

            <Section>
              <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-[#F5A623] p-6 text-white text-center">
                  <MapPin size={36} className="mx-auto mb-2" />
                  <h3 className="text-xl font-bold">Happy Ministry</h3>
                </div>

                <div className="p-8 space-y-5">
                  <div className="flex gap-4 items-start">
                    <MapPin className="text-[#F5A623] flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-[#1a1a1a]">{tx.location.addressLabel}</p>
                      <p className="text-[#666] text-sm mt-1 leading-relaxed whitespace-pre-line">
                        {tx.location.addressBody}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  <div className="flex gap-4 items-start">
                    <Users className="text-[#F5A623] flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-[#1a1a1a]">{tx.location.communityLabel}</p>
                      <p className="text-[#666] text-sm mt-1 leading-relaxed">
                        {tx.location.communityBody}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </section>

        <section id="contact" className="py-16 sm:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <Section>
              <div className="text-center mb-10 sm:mb-16">
                <p className="text-[#F5A623] font-semibold tracking-widest text-sm uppercase mb-3">
                  {tx.contact.eyebrow}
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4">
                  {tx.contact.heading}
                </h2>
                <div className="divider-cross text-[#F5A623] max-w-xs mx-auto">
                  <span className="text-2xl">&#10011;</span>
                </div>
                <p className="text-[#666] mt-6 max-w-md mx-auto">{tx.contact.subheading}</p>
              </div>
            </Section>

            <Section>
              <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2C2C2C] rounded-3xl overflow-hidden shadow-2xl">
                  <div className="p-8 sm:p-10 text-center border-b border-white/10">
                    <div className="w-20 h-20 bg-[#F5A623]/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-[#F5A623]/30">
                      <span className="text-3xl font-black text-[#F5A623]">HL</span>
                    </div>
                    <p className="text-[#F5A623] text-xs font-semibold tracking-widest uppercase mb-2">
                      {tx.contact.visionBearer}
                    </p>
                    <h3 className="text-white text-2xl font-bold">Happiness G. Lema</h3>
                  </div>

                  <div className="p-8 sm:p-10 space-y-5">
                    <a
                        href="tel:+255754496773"
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-[#F5A623]/10 hover:border-[#F5A623]/40 transition-all group"
                    >
                      <div className="w-10 h-10 bg-[#F5A623]/20 rounded-full flex items-center justify-center group-hover:bg-[#F5A623] transition-all">
                        <Phone className="text-[#F5A623] group-hover:text-white transition-colors" size={18} />
                      </div>
                      <div>
                        <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">
                          {tx.contact.phone}
                        </p>
                        <p className="text-white font-medium">0754 496 773 / 0715 496 773</p>
                      </div>
                    </a>
                    <a
                        href="mailto:dimkahappy70@icloud.com?subject=Happy Ministry Inquiry"
                        onClick={() => {
                          setTimeout(() => {
                            window.location.href =
                                'https://mail.google.com/mail/?view=cm&fs=1&to=dimkahappy70@icloud.com&su=Happy%20Ministry%20Inquiry';
                          }, 700);
                        }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-[#F5A623]/10 hover:border-[#F5A623]/40 transition-all group"
                    >
                      <div className="w-10 h-10 bg-[#F5A623]/20 rounded-full flex items-center justify-center group-hover:bg-[#F5A623] transition-all">
                        <Mail className="text-[#F5A623] group-hover:text-white transition-colors" size={18} />
                      </div>

                      <div>
                        <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">
                          {tx.contact.email}
                        </p>

                        <p className="text-white font-medium">
                          dimkahappy70@icloud.com
                        </p>
                      </div>
                    </a>

                    <a
                        href="mailto:dimkahappy70@icloud.com?subject=Happy Ministry Inquiry"
                        onClick={() => {
                          setTimeout(() => {
                            window.location.href =
                                'https://mail.google.com/mail/?view=cm&fs=1&to=dimkahappy70@icloud.com&su=Happy%20Ministry%20Inquiry';
                          }, 700);
                        }}
                        className="block w-full mt-6 bg-[#F5A623] hover:bg-[#E8920A] text-white font-bold py-4 rounded-xl text-center transition-all hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                    >
                      {tx.contact.sendMessage}
                    </a>
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </section>

        <footer className="bg-[#111] text-white/60 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="w-20 h-20 rounded-full bg-white border-2 border-[#F5A623]/40 flex items-center justify-center">
                <img
                    src="/IMG-20260614-WA0011.jpg"
                    alt="Happy Ministry Logo"
                    className="w-[70%] h-[70%] object-contain"
                />
              </div>

              <div>
                <p
                    className="text-white font-bold text-lg tracking-widest"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  HAPPY MINISTRY
                </p>
                <p className="text-white/40 text-sm mt-1">{tx.footer.sub}</p>
              </div>

              <div className="w-24 h-px bg-[#F5A623]/30" />

              <p className="text-white/30 text-xs max-w-md">{tx.footer.scripture}</p>

              <p className="text-white/20 text-xs mt-2">
                &copy; {new Date().getFullYear()} {tx.footer.rights}
              </p>
            </div>
          </div>
        </footer>
      </div>
  );
}

export default function App() {
  return (
      <AuthProvider>
        <MainContent />
      </AuthProvider>
  );
}