// script.js
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Intersection Observer for the scroll animation
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Lower threshold prevents the appearing/disappearing stutter
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add visible class when scrolled into view
                entry.target.classList.remove('hidden');
                entry.target.classList.add('visible');
            } else {
                // Remove class when scrolled out of view to re-animate when scrolling back
                entry.target.classList.remove('visible');
                entry.target.classList.add('hidden');
            }
        });
    }, observerOptions);

    // Target the achievement card
    const achievementCard = document.getElementById('achievementCard');
    if (achievementCard) {
        observer.observe(achievementCard);
    }

    // Target clip items
    const clipItems = document.querySelectorAll('.clip-item');
    clipItems.forEach(item => {
        observer.observe(item);
    });

    // 2. Add click event to scroll down indicator
    const scrollIndicator = document.getElementById('scrollIndicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const nextSection = document.querySelector('.reveal-section');
            if (nextSection) {
                nextSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // 3. Fallback for avatar image if none is provided
    const avatarImg = document.querySelector('.avatar');
    if (avatarImg) {
        avatarImg.addEventListener('error', function() {
            // Remove the glow effect if image totally fails to load
            const glow = document.querySelector('.avatar-glow');
            if (glow) {
                glow.style.display = 'none';
            }
        });
    }

    // 4. Music Player Logic
    const playBtn = document.getElementById('playBtn');
    const bgMusic = document.getElementById('bgMusic');
    const playIcon = document.getElementById('playIcon');
    const discIcon = document.getElementById('discIcon');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeIcon = document.getElementById('volumeIcon');

    if (playBtn && bgMusic) {
        // Set initial volume to 0.1 (quieter)
        bgMusic.volume = volumeSlider ? volumeSlider.value : 0.1;
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const vol = parseFloat(e.target.value);
                bgMusic.volume = vol;
                
                // Update icon dynamically
                if (vol === 0) {
                    volumeIcon.className = 'fas fa-volume-mute';
                } else if (vol < 0.5) {
                    volumeIcon.className = 'fas fa-volume-down';
                } else {
                    volumeIcon.className = 'fas fa-volume-up';
                }
            });
        }
        
        // Time control setup
        const timeSlider = document.getElementById('timeSlider');
        const currentTimeDisplay = document.getElementById('currentTimeDisplay');
        const durationDisplay = document.getElementById('durationDisplay');

        const formatTime = (time) => {
            if (!Number.isFinite(time) || isNaN(time)) return "0:00";
            const min = Math.floor(time / 60);
            const sec = Math.floor(time % 60);
            return `${min}:${sec < 10 ? '0' : ''}${sec}`;
        };

        const updatePlayerUI = () => {
             if (bgMusic.duration && Number.isFinite(bgMusic.duration)) {
                 timeSlider.max = bgMusic.duration;
                 durationDisplay.textContent = formatTime(bgMusic.duration);
             }
             timeSlider.value = bgMusic.currentTime;
             currentTimeDisplay.textContent = formatTime(bgMusic.currentTime);
        };

        let hasJumped = false;
        const initAudio = () => {
             // Jump to 194 only once on initial load
             if (!hasJumped && bgMusic.currentTime < 194) {
                 bgMusic.currentTime = 194;
                 hasJumped = true;
             }
             updatePlayerUI();
        };

        bgMusic.addEventListener('loadedmetadata', initAudio);
        bgMusic.addEventListener('canplay', initAudio);

        // If song.mp3 is missing, show error gracefully
        bgMusic.addEventListener('error', () => {
             currentTimeDisplay.textContent = "ERR";
             durationDisplay.textContent = "No MP3";
        });

        bgMusic.addEventListener('timeupdate', updatePlayerUI);

        timeSlider.addEventListener('input', () => {
             bgMusic.currentTime = timeSlider.value;
             currentTimeDisplay.textContent = formatTime(timeSlider.value);
        });
        
        bgMusic.addEventListener('ended', () => {
             bgMusic.currentTime = 194;
             bgMusic.play();
        });

        playBtn.addEventListener('click', () => {
            if (bgMusic.error) {
                alert("تعذر تشغيل الأغنية. تأكد من وجود ملف الصوت الصحيح في المجلد (مثلاً: song.mp3).");
                return;
            }

            if (bgMusic.paused) {
                bgMusic.play();
                playIcon.classList.remove('fa-play');
                playIcon.classList.add('fa-pause');
                discIcon.classList.add('spin-animation');
            } else {
                bgMusic.pause();
                playIcon.classList.remove('fa-pause');
                playIcon.classList.add('fa-play');
                discIcon.classList.remove('spin-animation');
            }
        });
    }

    // 5. Visitor Counter Logic
    const visitCountEl = document.getElementById('visit-count');
    if (visitCountEl) {
        const counterUrl = 'https://api.counterapi.dev/v1/danny-personal-website/visits/up';
        
        // Helper to format numbers with commas (e.g. 1000 -> 1,000)
        const formatNumber = (num) => {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        };

        const fetchVisitCount = async () => {
            try {
                // Fetch with a short timeout to prevent hanging if API is slow
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                
                const response = await fetch(counterUrl, { signal: controller.signal });
                clearTimeout(timeoutId);
                
                if (!response.ok) throw new Error('API request failed');
                const data = await response.json();
                
                if (data && typeof data.count === 'number') {
                    visitCountEl.textContent = formatNumber(data.count);
                    localStorage.setItem('last_known_visit_count', data.count);
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (error) {
                console.warn('CounterAPI error, falling back to local simulation:', error);
                
                let localCount = parseInt(localStorage.getItem('last_known_visit_count'), 10);
                if (isNaN(localCount) || localCount <= 0) {
                    localCount = 1047; // Default starter count
                }
                
                const sessionKey = 'basil_visited_this_session';
                if (!sessionStorage.getItem(sessionKey)) {
                    localCount += 1;
                    sessionStorage.setItem(sessionKey, 'true');
                }
                
                localStorage.setItem('last_known_visit_count', localCount);
                visitCountEl.textContent = formatNumber(localCount);
            }
        };

        fetchVisitCount();
    }
});
