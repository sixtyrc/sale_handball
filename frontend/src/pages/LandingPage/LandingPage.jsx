import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Menu, X, MapPin, Camera, Video, User, LogIn, ChevronRight, 
  MessageSquare, Shield, Zap, Users 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import clubLogoFallback from '../../assets/logo_club.png';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { branding, fetchBranding } = useAuthStore();

  useEffect(() => {
    fetchBranding?.('salesianos');
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logoSrc = branding?.logo 
    ? (branding.logo.startsWith('http') ? branding.logo : `http://localhost:8000${branding.logo}`) 
    : clubLogoFallback;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white font-sans overflow-x-hidden">
      
      {/* Botón flotante de WhatsApp */}
      <a 
        href="https://wa.me/5493624179453" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-110 hover:shadow-[0_0_30px_rgba(37,211,102,0.6)] transition-all duration-300 group"
      >
        <MessageSquare size={32} />
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-zinc-900 text-white text-sm font-semibold py-2 px-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Escribinos
        </span>
      </a>

      {/* NAVBAR */}
      <header 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled ? 'bg-black/90 backdrop-blur-md border-b border-white/10 py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 relative z-50">
            <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              <img src={logoSrc} alt="Club Logo" className="w-full h-full object-contain rounded-full" />
            </div>
            <span className="font-black italic text-xl tracking-tighter uppercase">
              Salesianos<span className="text-red-500">HB</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 font-semibold text-sm uppercase tracking-wide">
            <a href="#sobre-nosotros" className="hover:text-red-500 transition-colors">El Club</a>
            <a href="#multimedia" className="hover:text-red-500 transition-colors">Contenido</a>
            <a href="#ubicacion" className="hover:text-red-500 transition-colors">Sede</a>
            <div className="w-px h-6 bg-white/20"></div>
            <Link to="/socio/login" className="flex items-center gap-2 text-white hover:text-red-400 transition-colors group">
              <User size={18} className="group-hover:scale-110 transition-transform" />
              Socio
            </Link>
            <Link to="/login" className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transform hover:scale-105 transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]">
              <Shield size={18} />
              Staff
            </Link>
          </nav>

          {/* Mobile Nav Toggle */}
          <button 
            className="md:hidden relative z-50 text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 right-0 h-screen bg-black z-40 flex flex-col justify-center items-center gap-8 text-2xl font-black uppercase tracking-widest"
            >
              <a href="#sobre-nosotros" onClick={() => setMobileMenuOpen(false)} className="hover:text-red-500 transition-colors">El Club</a>
              <a href="#multimedia" onClick={() => setMobileMenuOpen(false)} className="hover:text-red-500 transition-colors">Contenido</a>
              <a href="#ubicacion" onClick={() => setMobileMenuOpen(false)} className="hover:text-red-500 transition-colors">Sede</a>
              
              <div className="w-32 h-px bg-white/20 my-4"></div>
              
              <Link to="/socio/login" className="flex items-center gap-3 text-white hover:text-red-500 transition-colors">
                <User size={24} /> Portal Socio
              </Link>
              <Link to="/login" className="flex items-center gap-3 text-red-500 hover:text-red-400 transition-colors">
                <Shield size={24} /> Acceso Staff
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image / Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black z-10" />
          <img 
            src="https://instagram.fres2-2.fna.fbcdn.net/v/t51.82787-15/529315786_18317994862236882_5795871723227635758_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=110&ig_cache_key=MzY5Mzk0MTA4NDIzODY3Njk1Nw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4OTU5LnNkci5DMyJ9&_nc_ohc=1qAXg95ywAsQ7kNvwFW9dhn&_nc_oc=AdqqGgpQ_ViiLMBpr56KYjmGX27ST3QlqIR7goLlQKHpChUncfkdeYj46uJys5BolxA&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fres2-2.fna&_nc_gid=GWBjlo62UiCuhf4L9Nm0pw&_nc_ss=7a32e&oh=00_Af0p9Fm8aezyXx4huf5eOaCPgSSUTDuZxogsAM_tgcDhew&oe=69D5F060" 
            alt="Fondo Handball Acción" 
            className="w-full h-full object-cover animate-slowPan"
          />
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black italic tracking-tighter uppercase leading-[0.9] text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-300 to-zinc-600 drop-shadow-2xl mb-4">
              Pura <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-rose-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]">
                Pasión.
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-zinc-300 font-medium tracking-wide mb-10 max-w-2xl mx-auto">
              Más que un club, somos una familia unida por la disciplina, la fuerza y la gloria en la cancha.
            </p>
            
            <a 
              href="https://wa.me/5493624179453?text=Hola!%20Quiero%20sumarme%20a%20entrenar%20en%20Salesianos." 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 md:px-10 md:py-5 bg-red-600 hover:bg-red-700 text-white font-bold text-lg md:text-xl uppercase tracking-widest rounded-none skew-x-[-10deg] transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(220,38,38,0.4)] group"
            >
              <span className="skew-x-[10deg] flex items-center gap-2">
                Sumate al Equipo <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
              </span>
            </a>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Descubrí más</span>
          <div className="w-px h-16 bg-gradient-to-b from-red-600 to-transparent" />
        </motion.div>
      </section>

      {/* SOBRE EL CLUB */}
      <section id="sobre-nosotros" className="py-24 bg-black relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-900/50 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
          >
            <div>
              <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-6">
                El corazón de <span className="text-red-500">Nuestra Historia</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-zinc-400 text-lg leading-relaxed mb-8">
                Salesianos Handball es sinónimo de garra y dedicación. Entrenamos Chicos / Chicas no solo para competir, sino para formar personas a través de los valores del deporte. Cada salto, cada pase y cada gol reflejan el compromiso de vestir esta camiseta.
              </motion.p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: <Shield size={32} />, title: "Disciplina", desc: "El talento sin esfuerzo no sirve. Formamos chicos / chicas que dejan todo en la cancha." },
                  { icon: <Users size={32} />, title: "Equipo", desc: "Ningún jugador es tan bueno como todos nosotros juntos." },
                  { icon: <Zap size={32} />, title: "Pasión", desc: "Sentimos los colores. Jugamos con la mente y el corazón." }
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeIn} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:border-red-500/30 transition-colors">
                    <div className="text-red-500 mb-4">{item.icon}</div>
                    <h3 className="text-xl font-bold mb-2 uppercase">{item.title}</h3>
                    <p className="text-sm text-zinc-500">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <motion.div variants={fadeIn} className="relative h-[600px] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
              <div className="absolute inset-0 bg-red-600 mix-blend-overlay opacity-10 z-10" />
              <img 
                src="https://instagram.fres2-1.fna.fbcdn.net/v/t51.82787-15/656480794_18134582908522658_3460125961558196154_n.webp?_nc_cat=106&ig_cache_key=MzQ1NzkzNzA5MTIxOTY3NzYwNA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4MTA4MC5zZHIuQzMifQ%3D%3D&oh=00_Af3lBpR5oD-D4xbF2x8I2QJMjCZzz8cdx2uJWd0ceDGlVg&oe=69D60CD6" 
                alt="Chicos y Chicas Salesianos Montecarlo" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 scale-105 hover:scale-100"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* MULTIMEDIA (YOUTUBE) */}
      <section id="multimedia" className="py-24 bg-zinc-950 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <div className="inline-flex items-center justify-center p-3 bg-red-500/10 text-red-500 rounded-full mb-6">
              <Video size={32} />
            </div>
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">
              Nuestra Pasión <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">En Vivo</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto mb-12 text-lg">
              Reviví los mejores partidos, las finales históricas y seguí nuestras transmisiones en directo por el canal oficial.
            </p>
          </motion.div>

          {/* YouTube Embed estático representativo (sin API key compleja, ideal usar iframe de un video real destacado) */}
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
            className="w-full max-w-4xl mx-auto aspect-video rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(220,38,38,0.15)] border border-zinc-800 bg-black group relative"
          >
            <iframe 
              width="100%" 
              height="100%" 
              src="https://www.youtube.com/embed/X3TgR-mAor8?autoplay=0&mute=0&controls=1" 
              title="Salesianos Handball Live"
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              className="relative z-20"
            ></iframe>
            {/* Overlay estético si el video no carga */}
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
               <Video size={48} className="text-zinc-800 animate-pulse" />
            </div>
          </motion.div>

          <div className="mt-10">
            <a 
              href="https://www.youtube.com/@salesianoshandball1854" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-red-500 font-bold uppercase tracking-wider hover:text-red-400 transition-colors border-b-2 border-red-500/30 hover:border-red-500 pb-1"
            >
              Suscribite al canal <ChevronRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* FEED INSTAGRAM (Simulado) */}
      <section className="py-20 bg-black overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter">
              Seguinos en la <span className="text-red-600">Cancha</span>
            </h2>
          </motion.div>
          <motion.a 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
            href="https://www.instagram.com/salesianoshandball/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-full text-white font-medium transition-all hover:bg-zinc-800"
          >
            <Camera size={20} /> @salesianoshandball
          </motion.a>
        </div>

        {/* Galería de fotos (Simulando feed) */}
        <div className="flex w-full overflow-x-auto snap-x snap-mandatory gap-4 px-6 lg:px-8 pb-10 scrollbar-hide">
          {[
            "https://instagram.fres2-2.fna.fbcdn.net/v/t51.82787-15/658784418_18313781818260357_849649566605286596_n.webp?_nc_cat=109&ig_cache_key=Mzg2NzE5NzMyODk2OTI2NzczMQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4MTkyMC5zZHIuQzMifQ%3D%3D&oh=00_Af2g6wJCG8TjeAC7u26cqdokEJlpvYQ7HgxDTeDt5s3FTA&oe=69D5FC3E",
            "https://instagram.fres2-1.fna.fbcdn.net/v/t51.82787-15/589028198_18299794090260357_3277895193659134444_n.webp?_nc_cat=105&ig_cache_key=Mzc4NzY0MDY0ODM2MzUwNjQ5OQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4MTQ0MC5zZHIuQzMifQ%3D%3D&oh=00_Af3XSVPNN1Tn7ZxOvdFpOtKRh7j5OFFn0T1GwXukdW4Xlw&oe=69D5F7F7",
            "https://instagram.fres2-1.fna.fbcdn.net/v/t51.82787-15/656480794_18134582908522658_3460125961558196154_n.webp?_nc_cat=106&ig_cache_key=MzQ1NzkzNzA5MTIxOTY3NzYwNA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4MTA4MC5zZHIuQzMifQ%3D%3D&oh=00_Af3lBpR5oD-D4xbF2x8I2QJMjCZzz8cdx2uJWd0ceDGlVg&oe=69D60CD6",
            "https://instagram.fres2-2.fna.fbcdn.net/v/t51.82787-15/529315786_18317994862236882_5795871723227635758_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=110&ig_cache_key=MzY5Mzk0MTA4NDIzODY3Njk1Nw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4OTU5LnNkci5DMyJ9&_nc_ohc=1qAXg95ywAsQ7kNvwFW9dhn&_nc_oc=AdqqGgpQ_ViiLMBpr56KYjmGX27ST3QlqIR7goLlQKHpChUncfkdeYj46uJys5BolxA&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fres2-2.fna&_nc_gid=GWBjlo62UiCuhf4L9Nm0pw&_nc_ss=7a32e&oh=00_Af0p9Fm8aezyXx4huf5eOaCPgSSUTDuZxogsAM_tgcDhew&oe=69D5F060"
          ].map((src, idx) => (
            <motion.a
              key={idx}
              href="https://www.instagram.com/salesianoshandball/"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative min-w-[280px] md:min-w-[350px] aspect-[4/5] rounded-2xl overflow-hidden snap-center group border border-zinc-800 cursor-pointer"
            >
              <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors z-10" />
              <img src={src} alt="Instagram feed" className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700 grayscale group-hover:grayscale-0" />
              <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-full">
                  <Camera size={32} className="text-white" />
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* UBICACIÓN & CONTACTO */}
      <section id="ubicacion" className="py-0 flex flex-col lg:flex-row bg-zinc-950 border-t border-zinc-900">
        <div className="w-full lg:w-1/2 p-10 lg:p-20 flex flex-col justify-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="max-w-md mx-auto lg:mx-0">
            <motion.h2 variants={fadeIn} className="text-4xl font-black italic uppercase tracking-tighter mb-6">
              Dónde <span className="text-red-500">Entrenamos</span>
            </motion.h2>
            <motion.p variants={fadeIn} className="text-zinc-400 mb-10 text-lg">
              Vení a probarte. Te esperamos en nuestra casa para ser parte de esta gran familia competitiva.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex items-start gap-4 mb-8">
              <div className="p-3 bg-red-600/10 text-red-500 rounded-xl">
                <MapPin size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white text-lg">Nuestra Sede</h4>
                <p className="text-zinc-400">Av. Italia 350, Resistencia, Chaco</p>
                <a href="https://maps.google.com/?q=Av.+Italia+350,+Resistencia" target="_blank" rel="noopener noreferrer" className="text-sm text-red-500 hover:text-red-400 font-semibold mt-1 inline-block">
                  Ver en Google Maps
                </a>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="flex items-start gap-4 mb-8">
              <div className="p-3 bg-zinc-800 text-zinc-300 rounded-xl">
                <MessageSquare size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white text-lg">Contacto Directo</h4>
                <p className="text-zinc-400">+54 9 3624179453</p>
              </div>
            </motion.div>

            <motion.a 
              variants={fadeIn}
              href="https://wa.me/5493624179453"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 w-full justify-center px-8 py-4 bg-white text-black hover:bg-zinc-200 font-bold text-lg uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Envíanos un WhatsApp
            </motion.a>
          </motion.div>
        </div>
        
        {/* MAPA */}
        <div className="w-full lg:w-1/2 min-h-[400px] lg:min-h-full grayscale hover:grayscale-0 transition-all duration-1000">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3540.669864213197!2d-58.9880192!3d-27.4484024!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94450c5a3b9eb2b9%3A0xe54e1a0b3f8f!2sAv.%20Italia%20350%2C%20H3500%20Resistencia%2C%20Chaco!5e0!3m2!1ses!2sar!4v1700000000000!5m2!1ses!2sar" 
            width="100%" 
            height="100%" 
            style={{ border: 0, minHeight: '100%' }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black py-10 border-t border-zinc-900 border-b-[8px] border-b-red-600">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-6 opacity-30 grayscale saturate-0 hover:grayscale-0 hover:opacity-100 transition-all">
            <img src={logoSrc} alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          
          <div className="flex items-center justify-center gap-6 mb-8 text-zinc-500">
            <a href="https://www.instagram.com/salesianoshandball/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <Camera size={24} />
            </a>
            <a href="https://www.youtube.com/@salesianoshandball1854" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <Video size={24} />
            </a>
          </div>

          <div className="text-zinc-600 text-sm font-medium tracking-wide flex flex-col md:flex-row items-center justify-center gap-2">
            <span>&copy; {new Date().getFullYear()} Salesianos Handball. Todos los derechos reservados.</span>
            <span className="hidden md:inline">|</span>
            <span>
              Desarrollado por{' '}
              <a href="https://ctsoft.com.ar" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white font-bold transition-colors">
                CTSoft
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
