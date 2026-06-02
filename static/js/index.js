window.HELP_IMPROVE_VIDEOJS = false;

// More Works Dropdown Functionality
function toggleMoreWorks() {
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        button.classList.add('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const container = document.querySelector('.more-works-container');
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (container && !container.contains(event.target)) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Close dropdown on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('moreWorksDropdown');
        const button = document.querySelector('.more-works-btn');
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('.copy-bibtex-btn');
    const copyText = button.querySelector('.copy-text');
    
    if (bibtexElement) {
        navigator.clipboard.writeText(bibtexElement.textContent).then(function() {
            // Success feedback
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bibtexElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        });
    }
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

// Autoplay standalone videos (NOT the managed video carousel) when in view.
function setupVideoCarouselAutoplay() {
    const carousel = document.getElementById('video-carousel');
    const videos = Array.prototype.filter.call(
        document.querySelectorAll('video'),
        (v) => !carousel || !carousel.contains(v)
    );

    if (videos.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Video is in view, play it
                video.play().catch(e => {
                    // Autoplay failed, probably due to browser policy
                    console.log('Autoplay prevented:', e);
                });
            } else {
                // Video is out of view, pause it
                video.pause();
            }
        });
    }, {
        threshold: 0.5 // Trigger when 50% of the video is visible
    });

    videos.forEach(video => {
        observer.observe(video);
    });
}

$(document).ready(function() {
    // Check for click events on the navbar burger icon

    var options = {
		slidesToScroll: 1,
		slidesToShow: 1,
		loop: true,
		infinite: true,
		autoplay: true,
		autoplaySpeed: 5000,
    }

    // The video carousel needs infinite:false so its pagination dots map 1:1 to
    // the three slides (bulma-carousel's dot count/active math breaks with clones).
    // loop:true still gives auto-advance with wrap-around.
    if (document.getElementById('video-carousel')) {
        bulmaCarousel.attach('#video-carousel', {
            slidesToScroll: 1,
            slidesToShow: 1,
            loop: true,
            infinite: false,
            autoplay: false,
        });
    }

	// Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);

    bulmaSlider.attach();

    // Manage the video carousel playback ourselves. The generic IntersectionObserver
    // (setupVideoCarouselAutoplay) would play ALL carousel videos at once, including
    // the off-screen slides; those firing 'ended' in the background would jump the
    // carousel unexpectedly. Instead, only the centered slide's video ever plays, and
    // we advance solely when THAT video finishes.
    var videoCarousel = carousels.filter(function (c) {
        return c.element && c.element.id === 'video-carousel';
    })[0];
    if (videoCarousel) {
        var carouselEl = document.getElementById('video-carousel');
        var carouselVideos = carouselEl.querySelectorAll('video');
        var sectionInView = true;

        var centeredVideo = function () {
            var crect = carouselEl.getBoundingClientRect();
            var center = crect.left + crect.width / 2;
            var active = null;
            var bestDist = Infinity;
            carouselVideos.forEach(function (v) {
                var r = v.getBoundingClientRect();
                if (r.width === 0) return; // skip hidden slides
                var dist = Math.abs((r.left + r.width / 2) - center);
                if (dist < bestDist) { bestDist = dist; active = v; }
            });
            return active;
        };

        // Play only the centered video; pause (and optionally rewind) all others.
        var syncPlayback = function (rewindActive) {
            var active = centeredVideo();
            carouselVideos.forEach(function (v) {
                if (v !== active) { v.pause(); }
            });
            if (!active) return;
            if (rewindActive) { active.currentTime = 0; }
            if (sectionInView) {
                active.play().catch(function () {});
            } else {
                active.pause();
            }
        };

        // On slide change, restart the newly-centered video from the beginning.
        videoCarousel.on('after:show', function () {
            setTimeout(function () { syncPlayback(true); }, 400);
        });

        // Advance only when the CURRENTLY CENTERED video ends (ignore background ones).
        carouselVideos.forEach(function (v) {
            v.addEventListener('ended', function () {
                if (v === centeredVideo()) { videoCarousel.next(); }
            });
        });

        // Pause when the carousel scrolls out of view; resume the centered video when back.
        var sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                sectionInView = entry.isIntersecting;
                syncPlayback(false);
            });
        }, { threshold: 0.3 });
        sectionObserver.observe(carouselEl);

        // Kick off the first video.
        syncPlayback(false);
    }

    // Autoplay any standalone (non-carousel) videos when they scroll into view.
    setupVideoCarouselAutoplay();

})
