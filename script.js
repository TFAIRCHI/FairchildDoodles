// ============================================
// Mobile Navigation Toggle
// ============================================
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
        navLinks.classList.toggle('open');
    });

    // Close menu when a nav link is clicked
    navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            navLinks.classList.remove('open');
        });
    });
}

// ============================================
// Scroll-Triggered Fade-In Animations
// ============================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
};

const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(function (el) {
    observer.observe(el);
});

// ============================================
// Puppy Filter Bar (puppies.html only)
// ============================================
const filterButtons = document.querySelectorAll('.filter-btn');
const puppyCards    = document.querySelectorAll('.puppy-card[data-status]');

if (filterButtons.length > 0 && puppyCards.length > 0) {
    filterButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            // Update active button
            filterButtons.forEach(function (b) { b.classList.remove('active'); });
            this.classList.add('active');

            var selected = this.getAttribute('data-filter');

            puppyCards.forEach(function (card) {
                if (selected === 'all' || card.getAttribute('data-status') === selected) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}

// ============================================
// Contact Form (contact.html only)
// ============================================
var contactForm  = document.getElementById('contactForm');
var formSuccess  = document.getElementById('formSuccess');

if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var formData = {
            name:     document.getElementById('name').value,
            email:    document.getElementById('email').value,
            phone:    document.getElementById('phone').value,
            interest: document.getElementById('interest').value,
            message:  document.getElementById('message').value
        };

        // Log for development
        console.log('Form submitted:', formData);

        // TODO: Replace with your Azure Function endpoint
        // fetch('YOUR_AZURE_FUNCTION_URL', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(formData)
        // })
        // .then(function (response) { return response.json(); })
        // .then(function (data) {
        //     console.log('Success:', data);
        //     showSuccess();
        // })
        // .catch(function (error) {
        //     console.error('Error:', error);
        //     alert('Something went wrong. Please try again.');
        // });

        // Show inline success message
        showSuccess();
    });
}

function showSuccess() {
    // Hide the form
    contactForm.style.display = 'none';

    // Show the success block
    if (formSuccess) {
        formSuccess.classList.add('visible');
    }
}

// ============================================
// Parents Carousel
// ============================================
var parentsCarousels = document.querySelectorAll('.parents-carousel');

parentsCarousels.forEach(function (carousel) {
    var slides = carousel.querySelectorAll('.parents-slide');
    var dotsContainer = carousel.querySelector('.parents-carousel-dots');
    var interval = parseInt(carousel.getAttribute('data-interval') || '4500', 10);
    var current = 0;
    var timerId = null;

    if (!slides.length || !dotsContainer) {
        return;
    }

    function setActive(index) {
        slides.forEach(function (slide, i) {
            slide.classList.toggle('is-active', i === index);
        });
        dotsContainer.querySelectorAll('button').forEach(function (dot, i) {
            dot.classList.toggle('is-active', i === index);
        });
        current = index;
    }

    slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Show slide ' + (i + 1));
        dot.addEventListener('click', function () {
            stopAuto();
            setActive(i);
            startAuto();
        });
        dotsContainer.appendChild(dot);
    });

    function next() {
        var nextIndex = (current + 1) % slides.length;
        setActive(nextIndex);
    }

    function prev() {
        var prevIndex = (current - 1 + slides.length) % slides.length;
        setActive(prevIndex);
    }

    function startAuto() {
        if (timerId) {
            return;
        }
        timerId = setInterval(next, interval);
    }

    function stopAuto() {
        if (timerId) {
            clearInterval(timerId);
            timerId = null;
        }
    }

    setActive(0);
    startAuto();

    var prevBtn = carousel.querySelector('.parents-carousel-prev');
    var nextBtn = carousel.querySelector('.parents-carousel-next');

    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            stopAuto();
            prev();
            startAuto();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            stopAuto();
            next();
            startAuto();
        });
    }

    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
});

// ============================================
// Puppy Card Carousels (puppies.html only)
// ============================================
var puppyCarousels = document.querySelectorAll('.puppy-card-carousel');

puppyCarousels.forEach(function (carousel) {
    var slides = carousel.querySelectorAll('.puppy-card-slide');
    var dotsContainer = carousel.querySelector('.puppy-card-dots');
    var interval = parseInt(carousel.getAttribute('data-interval') || '5000', 10);
    var current = 0;
    var timerId = null;

    if (!slides.length) {
        return;
    }

    function setActive(index) {
        slides.forEach(function (slide, i) {
            slide.classList.toggle('is-active', i === index);
        });
        if (dotsContainer) {
            dotsContainer.querySelectorAll('button').forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === index);
            });
        }
        current = index;
    }

    if (dotsContainer) {
        slides.forEach(function (_, i) {
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.setAttribute('aria-label', 'Show photo ' + (i + 1));
            dot.addEventListener('click', function () {
                stopAuto();
                setActive(i);
                startAuto();
            });
            dotsContainer.appendChild(dot);
        });
    }

    function next() {
        var nextIndex = (current + 1) % slides.length;
        setActive(nextIndex);
    }

    function prev() {
        var prevIndex = (current - 1 + slides.length) % slides.length;
        setActive(prevIndex);
    }

    function startAuto() {
        if (timerId) {
            return;
        }
        timerId = setInterval(next, interval);
    }

    function stopAuto() {
        if (timerId) {
            clearInterval(timerId);
            timerId = null;
        }
    }

    setActive(0);
    startAuto();

    var prevBtn = carousel.querySelector('.puppy-card-prev');
    var nextBtn = carousel.querySelector('.puppy-card-next');

    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            stopAuto();
            prev();
            startAuto();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            stopAuto();
            next();
            startAuto();
        });
    }

    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
});

// ============================================
// Puppy Card Lightbox (puppies.html only)
// ============================================
var puppyCardImages = document.querySelectorAll('.puppy-card-slide img');

if (puppyCardImages.length) {
    var puppyLightbox = document.querySelector('.gallery-lightbox');

    if (!puppyLightbox) {
        puppyLightbox = document.createElement('div');
        puppyLightbox.className = 'gallery-lightbox';
        puppyLightbox.innerHTML = '' +
            '<button class="gallery-lightbox-close" type="button" aria-label="Close">×</button>' +
            '<button class="gallery-lightbox-arrow gallery-lightbox-prev" type="button" aria-label="Previous">‹</button>' +
            '<img alt="Puppy photo">' +
            '<button class="gallery-lightbox-arrow gallery-lightbox-next" type="button" aria-label="Next">›</button>';
        document.body.appendChild(puppyLightbox);
    }

    var puppyLightboxImg = puppyLightbox.querySelector('img');
    var puppyCloseBtn = puppyLightbox.querySelector('.gallery-lightbox-close');
    var puppyPrevBtn = puppyLightbox.querySelector('.gallery-lightbox-prev');
    var puppyNextBtn = puppyLightbox.querySelector('.gallery-lightbox-next');
    var puppyLightboxItems = [];
    var puppyCurrentIndex = 0;

    function puppyOpenLightbox(index) {
        puppyCurrentIndex = index;
        puppyLightboxImg.src = puppyLightboxItems[index].src;
        puppyLightboxImg.alt = puppyLightboxItems[index].alt || 'Puppy photo';
        puppyLightbox.classList.add('is-active');
    }

    function puppyCloseLightbox() {
        puppyLightbox.classList.remove('is-active');
    }

    function puppyShowNext() {
        puppyCurrentIndex = (puppyCurrentIndex + 1) % puppyLightboxItems.length;
        puppyOpenLightbox(puppyCurrentIndex);
    }

    function puppyShowPrev() {
        puppyCurrentIndex = (puppyCurrentIndex - 1 + puppyLightboxItems.length) % puppyLightboxItems.length;
        puppyOpenLightbox(puppyCurrentIndex);
    }

    puppyLightbox.addEventListener('click', function (e) {
        if (e.target === puppyLightbox) {
            puppyCloseLightbox();
        }
    });
    if (puppyCloseBtn) {
        puppyCloseBtn.addEventListener('click', puppyCloseLightbox);
    }
    if (puppyNextBtn) {
        puppyNextBtn.addEventListener('click', puppyShowNext);
    }
    if (puppyPrevBtn) {
        puppyPrevBtn.addEventListener('click', puppyShowPrev);
    }

    puppyCardImages.forEach(function (img) {
        img.addEventListener('click', function () {
            var carousel = img.closest('.puppy-card-carousel');
            var slides = carousel ? carousel.querySelectorAll('.puppy-card-slide img') : [];
            puppyLightboxItems = Array.prototype.map.call(slides, function (slideImg) {
                return {
                    src: slideImg.getAttribute('src'),
                    alt: slideImg.getAttribute('alt')
                };
            });
            puppyCurrentIndex = Array.prototype.indexOf.call(slides, img);
            if (puppyCurrentIndex < 0) {
                puppyCurrentIndex = 0;
            }
            puppyOpenLightbox(puppyCurrentIndex);
        });
    });
}

// ============================================
// Puppy Gallery
// ============================================
var galleryGrid = document.getElementById('puppyGalleryGrid');

if (galleryGrid) {
    var dataSource = galleryGrid.getAttribute('data-source');
    var inlineDataEl = document.getElementById('puppyGalleryData');
    var galleryLightbox = document.createElement('div');
    galleryLightbox.className = 'gallery-lightbox';
    galleryLightbox.innerHTML = '' +
        '<button class="gallery-lightbox-close" type="button" aria-label="Close">×</button>' +
        '<button class="gallery-lightbox-arrow gallery-lightbox-prev" type="button" aria-label="Previous">‹</button>' +
        '<img alt="Gallery image">' +
        '<button class="gallery-lightbox-arrow gallery-lightbox-next" type="button" aria-label="Next">›</button>';
    document.body.appendChild(galleryLightbox);

    var lightboxImg = galleryLightbox.querySelector('img');
    var closeBtn = galleryLightbox.querySelector('.gallery-lightbox-close');
    var prevBtn = galleryLightbox.querySelector('.gallery-lightbox-prev');
    var nextBtn = galleryLightbox.querySelector('.gallery-lightbox-next');
    var galleryItems = [];
    var currentIndex = 0;

    function renderGrid(items) {
        galleryGrid.innerHTML = '';
        items.forEach(function (item, index) {
            var card = document.createElement('div');
            card.className = 'gallery-item';
            card.innerHTML = '<img src="' + item.src + '" alt="' + (item.alt || 'Puppy photo') + '">';
            card.addEventListener('click', function () {
                openLightbox(index);
            });
            galleryGrid.appendChild(card);
        });
    }

    function openLightbox(index) {
        currentIndex = index;
        lightboxImg.src = galleryItems[index].src;
        lightboxImg.alt = galleryItems[index].alt || 'Puppy photo';
        galleryLightbox.classList.add('is-active');
    }

    function closeLightbox() {
        galleryLightbox.classList.remove('is-active');
    }

    function showNext() {
        currentIndex = (currentIndex + 1) % galleryItems.length;
        openLightbox(currentIndex);
    }

    function showPrev() {
        currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
        openLightbox(currentIndex);
    }

    galleryLightbox.addEventListener('click', function (e) {
        if (e.target === galleryLightbox) {
            closeLightbox();
        }
    });
    closeBtn.addEventListener('click', closeLightbox);
    nextBtn.addEventListener('click', showNext);
    prevBtn.addEventListener('click', showPrev);

    function loadInlineData() {
        if (!inlineDataEl) {
            return false;
        }
        try {
            var parsed = JSON.parse(inlineDataEl.textContent);
            galleryItems = Array.isArray(parsed) ? parsed : [];
            if (galleryItems.length) {
                renderGrid(galleryItems);
                return true;
            }
        } catch (e) {
            return false;
        }
        return false;
    }

    var loadedInline = loadInlineData();

    if (!loadedInline && dataSource) {
        fetch(dataSource)
            .then(function (response) { return response.json(); })
            .then(function (data) {
                galleryItems = Array.isArray(data) ? data : [];
                if (galleryItems.length === 0) {
                    return;
                }
                renderGrid(galleryItems);
            })
            .catch(function () {
                // Silently fail if the manifest is missing
            });
    }
}
