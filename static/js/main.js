document.addEventListener('DOMContentLoaded', () => {

    // 1. Sticky Navbar Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Reveal Animations on Scroll
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // 3. Egypt Governorates & Cities Dynamic Logic
    const egyptLocations = {
        "القاهرة": ["مدينة نصر", "المعادي", "مصر الجديدة", "التجمع الخامس", "الرحاب", "مدينتي", "الشروق", "شبرا", "وسط البلد"],
        "الجيزة": ["المهندسين", "الدقي", "الهرم", "فيصل", "6 أكتوبر", "الشيخ زايد", "العجوزة", "إمبابة"],
        "الشرقية": ["الزقازيق", "العاشر من رمضان", "منيا القمح", "بلبيس", "فاقوس", "أبو حماد", "ديرب نجم"],
        "الإسكندرية": ["سموحة", "ميامي", "سيدي بشر", "العجمي", "المنتزه", "برج العرب", "الشاطبي"],
        "القليوبية": ["بنها", "شبرا الخيمة", "العبور", "القناطر الخيرية", "طوخ"],
        "الدقهلية": ["المنصورة", "ميت غمر", "السنبلاوين", "طلخا", "دكرنس"],
        "الغربية": ["طنطا", "المحلة الكبرى", "كفر الزيات", "زفتى"],
        "المنوفية": ["شبين الكوم", "منوف", "أشمون", "السادات", "قويسنا"],
        "البحيرة": ["دمنهور", "كفر الدوار", "رشيد", "إدكو"]
    };

    const govSelect = document.getElementById('governorate');
    const citySelect = document.getElementById('city');

    if (govSelect && citySelect) {
        // Populate Governorates
        Object.keys(egyptLocations).forEach(gov => {
            const option = document.createElement('option');
            option.value = gov;
            option.textContent = gov;
            govSelect.appendChild(option);
        });

        // Handle Change Event
        govSelect.addEventListener('change', () => {
            const selectedGov = govSelect.value;
            citySelect.innerHTML = '<option value="" disabled selected>اختر المدينة / المنطقة</option>'; // Reset
            
            if (egyptLocations[selectedGov]) {
                egyptLocations[selectedGov].forEach(city => {
                    const option = document.createElement('option');
                    option.value = city;
                    option.textContent = city;
                    citySelect.appendChild(option);
                });
                citySelect.disabled = false; // Enable cities dropdown
            } else {
                citySelect.disabled = true; // Disable if unexpected value
            }
        });
    }

    // 4. Mobile Bottom Nav Interactive Dragging & Animations
    const mobileNav = document.querySelector('.mobile-bottom-nav');
    if (mobileNav) {
        let indicator = document.querySelector('.nav-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'nav-indicator';
            mobileNav.insertBefore(indicator, mobileNav.firstChild);
        }
        
        const navItems = Array.from(mobileNav.querySelectorAll('.nav-item:not(.center-add-btn)'));
        let activeItem = null;
        let currentPath = window.location.pathname.split('/').pop();
        if (!currentPath || currentPath === '') currentPath = 'home.html';
        
        const setActiveState = (item) => {
            navItems.forEach(nav => {
                nav.classList.remove('active');
                const i = nav.querySelector('i');
                if (i && i.dataset.origClass) {
                    i.className = i.dataset.origClass;
                }
            });
            item.classList.add('active');
            
            const icon = item.querySelector('i');
            if (icon) {
                if (!icon.dataset.origClass) icon.dataset.origClass = icon.className;
                
                if (icon.classList.contains('fa-house')) {
                    icon.className = icon.className.replace('fa-house', 'fa-door-open fa-bounce');
                } else if (icon.classList.contains('fa-magnifying-glass')) {
                    icon.classList.add('search-scan');
                } else if (icon.classList.contains('fa-phone')) {
                    icon.classList.add('fa-shake');
                } else if (icon.classList.contains('fa-user')) {
                    icon.classList.add('fa-beat');
                }
            }
        };

        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === currentPath || (currentPath === '' && href === 'home.html')) {
                activeItem = item;
            }
            
            item.addEventListener('click', (e) => {
                if(item.getAttribute('href') === '#') {
                    e.preventDefault();
                    setActiveState(item);
                    indicator.style.transition = 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                    indicator.style.width = item.offsetWidth + 10 + 'px';
                    indicator.style.left = item.offsetLeft - 5 + 'px';
                    return;
                }
                e.preventDefault();
                indicator.style.transition = 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                setActiveState(item);
                
                indicator.style.width = item.offsetWidth + 10 + 'px';
                indicator.style.left = item.offsetLeft - 5 + 'px';
                
                setTimeout(() => {
                    window.location.href = href;
                }, 400); 
            });
        });
        
        if (!activeItem && navItems.length > 0) activeItem = navItems[0];
        
        // Touch Drag Logic
        let isDragging = false;
        mobileNav.addEventListener('touchmove', (e) => {
            if(e.target.closest('.center-add-btn')) return;
            e.preventDefault();
            isDragging = true;
            indicator.style.transition = 'none';
            
            const touch = e.touches[0];
            const navRect = mobileNav.getBoundingClientRect();
            let newLeft = touch.clientX - navRect.left - (indicator.offsetWidth / 2);
            newLeft = Math.max(0, Math.min(newLeft, navRect.width - indicator.offsetWidth));
            indicator.style.left = newLeft + 'px';
        }, { passive: false });

        mobileNav.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;
            indicator.style.transition = 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
            
            const indRect = indicator.getBoundingClientRect();
            const indCenter = indRect.left + indRect.width / 2;
            
            let closest = activeItem;
            let minDistance = Infinity;
            
            navItems.forEach(item => {
                const itemRect = item.getBoundingClientRect();
                const itemCenter = itemRect.left + itemRect.width / 2;
                const distance = Math.abs(indCenter - itemCenter);
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = item;
                }
            });
            
            if (closest) {
                setActiveState(closest);
                indicator.style.width = closest.offsetWidth + 10 + 'px';
                indicator.style.left = closest.offsetLeft - 5 + 'px';
                const href = closest.getAttribute('href');
                if(href !== '#' && closest !== activeItem) {
                    setTimeout(() => {
                        window.location.href = href;
                    }, 400);
                }
                activeItem = closest;
            }
        });

        if (activeItem) {
            setActiveState(activeItem);
            setTimeout(() => {
                indicator.style.transition = 'none';
                indicator.style.width = activeItem.offsetWidth + 10 + 'px';
                indicator.style.left = activeItem.offsetLeft - 5 + 'px';
                setTimeout(() => {
                     indicator.style.transition = 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                }, 50);
            }, 100);
        }
        
        window.addEventListener('resize', () => {
            const currentActive = mobileNav.querySelector('.nav-item.active:not(.center-add-btn)');
            if (currentActive) {
                indicator.style.transition = 'none';
                indicator.style.width = currentActive.offsetWidth + 10 + 'px';
                indicator.style.left = currentActive.offsetLeft - 5 + 'px';
            }
        });
    }

});
