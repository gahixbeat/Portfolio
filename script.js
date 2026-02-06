/**
 * Portfolio Compositeur - Script Principal
 * Gère la navigation, les animations au scroll et le lecteur audio
 */

document.addEventListener('DOMContentLoaded', () => {
    // ============================
    // Navigation
    // ============================
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Effet de scroll sur la navbar
    const handleNavbarScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleNavbarScroll);

    // Toggle menu mobile
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Fermer le menu au clic sur un lien
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Mise à jour du lien actif au scroll
    const sections = document.querySelectorAll('section[id], header[id]');

    const updateActiveLink = () => {
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos < top + height) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };

    window.addEventListener('scroll', updateActiveLink);

    // ============================
    // Animations au scroll (Reveal)
    // ============================
    const revealElements = document.querySelectorAll('.reveal');

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const revealPoint = 150;

        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;

            if (elementTop < windowHeight - revealPoint) {
                element.classList.add('visible');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Vérifier au chargement

    // ============================
    // Lecteur Audio
    // ============================
    const audioPlayers = document.querySelectorAll('.audio-player');
    let currentlyPlaying = null;

    audioPlayers.forEach(player => {
        const playBtn = player.querySelector('.play-btn');
        const progressBar = player.querySelector('.progress-bar');
        const progressFill = player.querySelector('.progress-fill');
        const currentTimeEl = player.querySelector('.current-time');
        const durationEl = player.querySelector('.duration');
        const audio = player.querySelector('audio');

        // Formater le temps en mm:ss
        const formatTime = (seconds) => {
            if (isNaN(seconds)) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        // Mettre à jour la durée quand les métadonnées sont chargées
        audio.addEventListener('loadedmetadata', () => {
            durationEl.textContent = formatTime(audio.duration);
        });

        // Bouton play/pause
        playBtn.addEventListener('click', () => {
            // Arrêter l'autre lecteur en cours
            if (currentlyPlaying && currentlyPlaying !== audio) {
                currentlyPlaying.pause();
                currentlyPlaying.parentElement.querySelector('.play-btn').classList.remove('playing');
            }

            if (audio.paused) {
                audio.play();
                playBtn.classList.add('playing');
                currentlyPlaying = audio;
            } else {
                audio.pause();
                playBtn.classList.remove('playing');
                currentlyPlaying = null;
            }
        });

        // Mise à jour de la progression
        audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = `${progress}%`;
            currentTimeEl.textContent = formatTime(audio.currentTime);
        });

        // Clic sur la barre de progression
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            audio.currentTime = clickPos * audio.duration;
        });

        // Fin de la lecture
        audio.addEventListener('ended', () => {
            playBtn.classList.remove('playing');
            progressFill.style.width = '0%';
            currentTimeEl.textContent = '0:00';
            currentlyPlaying = null;
        });
    });

    // ============================
    // Smooth scroll pour les ancres
    // ============================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
});
