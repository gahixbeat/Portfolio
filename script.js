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
    // Lecteur Audio avec Visualiseur
    // ============================
    const audioPlayers = document.querySelectorAll('.audio-player');
    let currentlyPlaying = null;
    let currentAudioContext = null;
    let currentAnalyser = null;
    let animationId = null;

    // Créer le contexte audio (Web Audio API)
    const createAudioContext = () => {
        if (!currentAudioContext) {
            currentAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return currentAudioContext;
    };

    audioPlayers.forEach(player => {
        const playBtn = player.querySelector('.play-btn');
        const progressBar = player.querySelector('.progress-bar');
        const progressFill = player.querySelector('.progress-fill');
        const currentTimeEl = player.querySelector('.current-time');
        const durationEl = player.querySelector('.duration');
        const audio = player.querySelector('audio');
        const visualizerBars = player.querySelectorAll('.visualizer-bar');

        let audioSource = null;
        let analyser = null;
        let isConnected = false;

        // Formater le temps en mm:ss
        const formatTime = (seconds) => {
            if (isNaN(seconds)) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        // Mettre à jour le visualiseur
        const updateVisualizer = () => {
            if (!analyser || audio.paused) return;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);

            // Mapper les fréquences aux barres
            const barCount = visualizerBars.length;
            const step = Math.floor(dataArray.length / barCount);

            visualizerBars.forEach((bar, index) => {
                const value = dataArray[index * step];
                const height = Math.max(4, (value / 255) * 28);
                bar.style.height = `${height}px`;
            });

            animationId = requestAnimationFrame(updateVisualizer);
        };

        // Configurer Web Audio API (optionnel, ne bloque pas la lecture)
        const setupAudioContext = () => {
            if (isConnected) return true;

            // Désactiver Web Audio API en local (file://) pour éviter les problèmes CORS et le silence
            if (window.location.protocol === 'file:') {
                console.log('Mode local détecté : Visualiseur désactivé pour garantir le son');
                return false;
            }

            try {
                const ctx = createAudioContext();

                // Vérifier si déjà connecté
                if (audio._sourceNode) {
                    analyser = ctx.createAnalyser();
                    analyser.fftSize = 64;
                    audio._sourceNode.connect(analyser);
                    analyser.connect(ctx.destination);
                    isConnected = true;
                    player.classList.add('visualizing');
                    return true;
                }

                audioSource = ctx.createMediaElementSource(audio);
                audio._sourceNode = audioSource; // Stocker la référence
                analyser = ctx.createAnalyser();
                analyser.fftSize = 64;

                audioSource.connect(analyser);
                analyser.connect(ctx.destination);

                isConnected = true;
                player.classList.add('visualizing');
                return true;
            } catch (e) {
                console.log('Web Audio API non disponible pour ce fichier:', e.message);
                // Ne pas bloquer la lecture - l'audio fonctionnera sans visualiseur
                return false;
            }
        };

        // Gestion du chargement
        audio.addEventListener('waiting', () => {
            player.classList.add('loading');
        });

        audio.addEventListener('canplay', () => {
            player.classList.remove('loading');
        });

        audio.addEventListener('loadstart', () => {
            if (audio.readyState < 3) {
                player.classList.add('loading');
            }
        });

        // Mettre à jour la durée quand les métadonnées sont chargées
        audio.addEventListener('loadedmetadata', () => {
            durationEl.textContent = formatTime(audio.duration);
            player.classList.remove('loading');
        });

        // Bouton play/pause
        playBtn.addEventListener('click', () => {
            // Arrêter l'autre lecteur en cours
            if (currentlyPlaying && currentlyPlaying !== audio) {
                currentlyPlaying.pause();
                const otherPlayer = currentlyPlaying.closest('.audio-player');
                otherPlayer.querySelector('.play-btn').classList.remove('playing');
                otherPlayer.classList.remove('playing');
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
            }

            if (audio.paused) {
                // Reprendre le contexte audio si suspendu
                if (currentAudioContext && currentAudioContext.state === 'suspended') {
                    currentAudioContext.resume();
                }

                // Jouer l'audio d'abord
                audio.play().then(() => {
                    playBtn.classList.add('playing');
                    player.classList.add('playing');
                    currentlyPlaying = audio;

                    // Essayer d'initialiser le visualiseur après lecture réussie
                    try {
                        if (setupAudioContext()) {
                            currentAnalyser = analyser;
                            updateVisualizer();
                        }
                    } catch (e) {
                        // Visualiseur optionnel - l'audio joue quand même
                        console.log('Visualiseur non disponible');
                    }
                }).catch(err => {
                    console.log('Erreur de lecture:', err);
                    player.classList.remove('loading');
                });
            } else {
                audio.pause();
                playBtn.classList.remove('playing');
                player.classList.remove('playing');
                currentlyPlaying = null;
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
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
            player.classList.remove('playing');
            progressFill.style.width = '0%';
            currentTimeEl.textContent = '0:00';
            currentlyPlaying = null;
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            // Réinitialiser les barres
            visualizerBars.forEach(bar => {
                bar.style.height = '4px';
            });
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
