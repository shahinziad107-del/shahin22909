// Dark Mode Initialization (Run immediately to prevent flash)
const currentTheme = localStorage.getItem('theme') || 'auto';
if (currentTheme === 'dark' || (currentTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
}

document.addEventListener('DOMContentLoaded', () => {

    // 1. Smart Navbar Effect
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    if (navbar) {
        window.addEventListener('scroll', () => {
            const currentScroll = window.scrollY;
            if (currentScroll > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            if (currentScroll <= 0) {
                navbar.classList.remove('scrolled-up');
                navbar.classList.remove('scrolled-down');
                return;
            }
            if (currentScroll > lastScroll && !navbar.classList.contains('scrolled-down') && currentScroll > 100) {
                // Scroll down
                navbar.classList.remove('scrolled-up');
                navbar.classList.add('scrolled-down');
            } else if (currentScroll < lastScroll && navbar.classList.contains('scrolled-down')) {
                // Scroll up
                navbar.classList.remove('scrolled-down');
                navbar.classList.add('scrolled-up');
            }
            lastScroll = currentScroll;
        });
    }

    // 1.5 Glass Theme Toggle Logic
    const themeToggleContainer = document.querySelector('.glass-theme-toggle');
    const themeBtns = document.querySelectorAll('.theme-btn');
    
    function applyTheme(theme) {
        if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    if (themeToggleContainer && themeBtns.length > 0) {
        const savedTheme = localStorage.getItem('theme') || 'auto';
        themeToggleContainer.setAttribute('data-active', savedTheme);
        themeBtns.forEach(btn => {
            if (btn.getAttribute('data-theme-val') === savedTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        applyTheme(savedTheme);

        let currentThemeIndex = ['light', 'dark', 'auto'].indexOf(savedTheme);
        if (currentThemeIndex === -1) currentThemeIndex = 2;

        themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const selectedTheme = btn.getAttribute('data-theme-val');
                localStorage.setItem('theme', selectedTheme);
                
                themeToggleContainer.setAttribute('data-active', selectedTheme);
                
                themeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                applyTheme(selectedTheme);
                currentThemeIndex = ['light', 'dark', 'auto'].indexOf(selectedTheme);
            });
        });

        // Swipe/Drag functionality
        let isDraggingTheme = false;
        let capturedThemePointer = null;
        let startXTheme = 0;

        themeToggleContainer.addEventListener('pointerdown', (e) => {
            isDraggingTheme = false;
            startXTheme = e.clientX;
            capturedThemePointer = e.pointerId;
        });

        themeToggleContainer.addEventListener('pointermove', (e) => {
            const diffX = e.clientX - startXTheme;
            if (e.pointerId !== capturedThemePointer || Math.abs(diffX) <= 20) return;
            if (!isDraggingTheme) {
                isDraggingTheme = true;
                themeToggleContainer.setPointerCapture(e.pointerId);
            }
            
            if (diffX > 20) { // Dragged right
                e.preventDefault();
                if (currentThemeIndex < 2) {
                    currentThemeIndex++;
                    const themes = ['light', 'dark', 'auto'];
                    const btn = document.querySelector(`.theme-btn[data-theme-val="${themes[currentThemeIndex]}"]`);
                    if (btn) btn.click();
                    startXTheme = e.clientX;
                }
            } else if (diffX < -20) { // Dragged left
                e.preventDefault();
                if (currentThemeIndex > 0) {
                    currentThemeIndex--;
                    const themes = ['light', 'dark', 'auto'];
                    const btn = document.querySelector(`.theme-btn[data-theme-val="${themes[currentThemeIndex]}"]`);
                    if (btn) btn.click();
                    startXTheme = e.clientX;
                }
            }
        });

        themeToggleContainer.addEventListener('pointerup', (e) => {
            if (isDraggingTheme && themeToggleContainer.hasPointerCapture(e.pointerId)) {
                themeToggleContainer.releasePointerCapture(e.pointerId);
            }
            isDraggingTheme = false;
            capturedThemePointer = null;
        });
        
        themeToggleContainer.addEventListener('pointercancel', () => {
            isDraggingTheme = false;
            capturedThemePointer = null;
        });
        
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (localStorage.getItem('theme') === 'auto') {
                applyTheme('auto');
            }
        });
    } else {
        const themeToggleBtn = document.getElementById('theme-toggle');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                let theme = document.documentElement.getAttribute('data-theme');
                if (theme === 'dark') {
                    document.documentElement.removeAttribute('data-theme');
                    localStorage.setItem('theme', 'light');
                } else {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    localStorage.setItem('theme', 'dark');
                }
            });
        }
    }



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
        "القاهرة": ["مدينة نصر", "المعادي", "مصر الجديدة", "التجمع الخامس", "الرحاب", "مدينتي", "الشروق", "شبرا", "وسط البلد", "المقطم", "الزمالك", "المهندسين", "حلوان", "العباسية", "عين شمس", "المرج"],
        "الجيزة": ["المهندسين", "الدقي", "الهرم", "فيصل", "6 أكتوبر", "الشيخ زايد", "العجوزة", "إمبابة", "البدرشين", "الحوامدية", "العياط", "الصف"],
        "الإسكندرية": ["سموحة", "ميامي", "سيدي بشر", "العجمي", "المنتزه", "برج العرب", "الشاطبي", "كليوباترا", "المندرة", "لوران", "سيدي جابر", "محرم بك", "السيوف", "المعمورة", "بيانكي", "الساحل الشمالي للإسكندرية"],
        "الشرقية": ["الزقازيق", "العاشر من رمضان", "منيا القمح", "بلبيس", "فاقوس", "أبو حماد", "ديرب نجم", "الحسينية", "أبو كبير"],
        "القليوبية": ["بنها", "شبرا الخيمة", "العبور", "القناطر الخيرية", "طوخ", "قليوب", "الخانكة", "شبين القناطر"],
        "الدقهلية": ["المنصورة", "ميت غمر", "السنبلاوين", "طلخا", "دكرنس", "بلقاس", "شربين", "أجا", "المنزلة"],
        "الغربية": ["طنطا", "المحلة الكبرى", "كفر الزيات", "زفتى", "السنطة", "قطور", "بسيون", "سمنود"],
        "المنوفية": ["شبين الكوم", "منوف", "أشمون", "السادات", "قويسنا", "تلا", "الباجور", "الشهداء"],
        "البحيرة": ["دمنهور", "كفر الدوار", "رشيد", "إدكو", "أبو حمص", "وادي النطرون", "إيتاي البارود", "المحمودية"],
        "كفر الشيخ": ["كفر الشيخ", "دسوق", "فوه", "مطوبس", "بلطيم", "قلين", "سيدي سالم", "بيلا"],
        "دمياط": ["دمياط", "دمياط الجديدة", "رأس البر", "فارسكور", "الزرقا", "كفر سعد"],
        "بورسعيد": ["حي الشرق", "حي العرب", "حي المناخ", "حي الضواحي", "حي الزهور", "بورفؤاد"],
        "الإسماعيلية": ["الإسماعيلية", "فايد", "القصاصين", "التل الكبير", "القنطرة شرق", "القنطرة غرب"],
        "السويس": ["حي السويس", "حي الأربعين", "حي عتاقة", "حي الجناين", "حي فيصل"],
        "مطروح": ["مرسى مطروح", "العلمين", "الضبعة", "سيدي عبد الرحمن", "الحمام", "السلوم", "عجيبة", "الأبيض", "روميل", "كليوباترا", "الفيروز"],
        "البحر الأحمر": ["الغردقة", "سفاجا", "القصير", "مرسى علم", "رأس غارب", "الجونة", "مكادي باي", "سهل حشيش", "سوما باي"],
        "الفيوم": ["الفيوم", "طامية", "إطسا", "سنورس", "أبشواي"],
        "بني سويف": ["بني سويف", "الواسطى", "ناصر", "ببا", "الفشن", "سمسطا"],
        "المنيا": ["المنيا", "المنيا الجديدة", "مغاغة", "بني مزار", "مطاي", "سمالوط", "أبو قرقاص", "ملوي", "دير مواس"],
        "أسيوط": ["أسيوط", "أسيوط الجديدة", "ديروط", "القوصية", "أبنوب", "منفلوط", "أبو تيج", "الغنايم"],
        "سوهاج": ["سوهاج", "سوهاج الجديدة", "أخميم", "المراغة", "طهطا", "طما", "جرجا", "البلينا"],
        "قنا": ["قنا", "قنا الجديدة", "نجع حمادي", "قوص", "أبو تشت", "فرشوط", "دشنا", "الوقف"],
        "الأقصر": ["الأقصر", "طيبة الجديدة", "إسنا", "أرمنت", "القرنة", "البياضية"],
        "أسوان": ["أسوان", "أسوان الجديدة", "كوم أمبو", "إدفو", "دراو", "نصر النوبة"],
        "الساحل الشمالي (الطيب)": ["مارينا", "مراقيا", "ماربيلا", "سيدي كرير", "عايدة", "بلبع", "الأحلام", "زمردة", "مرسيليا"],
        "الساحل الشمالي (الشرير)": ["مراسي", "هاسيندا باي", "هاسيندا وايت", "أمواج", "سيشل", "فوكا باي", "تلال", "سيدي عبد الرحمن", "بو أيلاند"],
        "جنوب سيناء": ["شرم الشيخ", "دهب", "نويبع", "طابا", "رأس سدر", "خليج نعمة"],
        "العين السخنة": ["بورتو السخنة", "المونت جلالة", "أزها", "تلال السخنة", "بلومار", "بوهو", "لافيستا"]
    };

    function initLocationSelects(govId, cityId, defaultCityText) {
        const govSelect = document.getElementById(govId);
        const citySelect = document.getElementById(cityId);

        if (govSelect && citySelect) {
            Object.keys(egyptLocations).forEach(gov => {
                const option = document.createElement('option');
                option.value = gov;
                option.textContent = gov;
                govSelect.appendChild(option);
            });

            govSelect.addEventListener('change', () => {
                const selectedGov = govSelect.value;
                citySelect.innerHTML = `<option value="" selected>${defaultCityText}</option>`; // Reset
                
                if (egyptLocations[selectedGov]) {
                    egyptLocations[selectedGov].forEach(city => {
                        const option = document.createElement('option');
                        option.value = city;
                        option.textContent = city;
                        citySelect.appendChild(option);
                    });
                    citySelect.disabled = false; 
                } else {
                    citySelect.disabled = true;
                }
            });
        }
    }

    // Initialize for Add Property Page
    initLocationSelects('governorate', 'city', 'اختر المدينة / المنطقة');
    // Initialize for Search Modal
    initLocationSelects('search-governorate', 'search-city', 'كل المدن');

    // 3.5 Summer Resorts Dynamic Logic
    const summerLocations = {
        "الساحل الشمالي (الطيب)": ["مارينا", "مراقيا", "ماربيلا", "سيدي كرير", "عايدة", "بلبع", "الأحلام", "زمردة", "مرسيليا"],
        "الساحل الشمالي (الشرير)": ["مراسي", "هاسيندا باي", "هاسيندا وايت", "أمواج", "سيشل", "فوكا باي", "تلال", "سيدي عبد الرحمن", "بو أيلاند"],
        "مطروح": ["مرسى مطروح", "عجيبة", "الأبيض", "روميل", "كليوباترا", "الفيروز", "السلوم"],
        "الإسكندرية": ["المعمورة", "المنتزه", "ميامي", "بيانكي", "العجمي", "سيدي بشر", "الساحل الشمالي للإسكندرية"],
        "البحر الأحمر": ["الغردقة", "الجونة", "مكادي باي", "سهل حشيش", "سفاجا", "سوما باي"],
        "جنوب سيناء": ["شرم الشيخ", "دهب", "نويبع", "طابا", "رأس سدر", "خليج نعمة"],
        "العين السخنة": ["بورتو السخنة", "المونت جلالة", "أزها", "تلال السخنة", "بلومار", "بوهو", "لافيستا"]
    };

    function initSummerSelects(regionId, areaId, defaultAreaText) {
        const regionSelect = document.getElementById(regionId);
        const areaSelect = document.getElementById(areaId);

        if (regionSelect && areaSelect) {
            Object.keys(summerLocations).forEach(region => {
                const option = document.createElement('option');
                option.value = region;
                option.textContent = region;
                regionSelect.appendChild(option);
            });

            regionSelect.addEventListener('change', () => {
                const selectedRegion = regionSelect.value;
                areaSelect.innerHTML = `<option value="" selected>${defaultAreaText}</option>`; // Reset
                
                if (summerLocations[selectedRegion]) {
                    summerLocations[selectedRegion].forEach(area => {
                        const option = document.createElement('option');
                        option.value = area;
                        option.textContent = area;
                        areaSelect.appendChild(option);
                    });
                    areaSelect.disabled = false; 
                } else {
                    areaSelect.disabled = true;
                }
            });
        }
    }

    // Initialize for Summer Search Modal
    initSummerSelects('summer-search-region', 'summer-search-area', 'كل القرى والمنتجعات');

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
                if (closest !== activeItem) {
                    if (href !== '#') {
                        setTimeout(() => {
                            window.location.href = href;
                        }, 400);
                    } else {
                        setTimeout(() => {
                            closest.click();
                        }, 150);
                    }
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

    // 5. Summer Resort Banner Injection
    const currentPath = window.location.pathname.split('/').pop();
    const allowedPages = ['home.html', '', '/', 'index.html'];
    if (allowedPages.includes(currentPath)) {
        const existingBanner = document.getElementById('summerBanner');
        if (!existingBanner) {
            const bannerHTML = `
                <div class="summer-resort-banner" id="summerBanner">
                    <button class="close-banner" id="closeSummerBanner" aria-label="إغلاق"><i class="fa-solid fa-xmark"></i></button>
                    <div class="banner-content" data-bs-toggle="modal" data-bs-target="#summerSearchModal">
                        <div class="banner-icon-wrapper">
                            <i class="fa-solid fa-umbrella-beach fa-bounce"></i>
                        </div>
                        <div class="banner-text">
                            <strong>صيّف معانا! 🌊</strong>
                            <span>احجز شاليهك في الساحل ومارينا الآن بأفضل الأسعار.</span>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', bannerHTML);
            
            document.getElementById('closeSummerBanner').addEventListener('click', (e) => {
                e.stopPropagation();
                const b = document.getElementById('summerBanner');
                if(window.innerWidth <= 768) {
                    b.style.transform = 'translate(-50%, 120%)';
                } else {
                    b.style.transform = 'translateX(-120%)';
                }
                setTimeout(() => {
                    if(b) b.remove();
                }, 400);
            });
        }
    }

});


document.addEventListener("DOMContentLoaded", () => {
    const floatingSearch = document.getElementById('desktop-floating-search');
    if (floatingSearch) {
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            // Hide on scroll down, show on scroll up
            if (currentScrollY > lastScrollY && currentScrollY > 150) {
                floatingSearch.classList.add('hidden');
            } else {
                floatingSearch.classList.remove('hidden');
            }
            lastScrollY = currentScrollY;
        }, { passive: true });
    }
});


document.addEventListener("DOMContentLoaded", () => {
    const floatingSearch = document.getElementById('desktop-floating-search');
    const searchModalEl = document.getElementById('searchModal');
    
    if (searchModalEl && floatingSearch) {
        searchModalEl.addEventListener('show.bs.modal', () => {
            floatingSearch.classList.add('morph-hidden');
        });
        searchModalEl.addEventListener('hidden.bs.modal', () => {
            floatingSearch.classList.remove('morph-hidden');
        });
    }
});


// Fix BFCache Animation Freeze for Liquid Glass Buttons
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        document.querySelectorAll('.liquid-search-btn, .chat-toggle-btn').forEach(btn => {
            const oldAnimation = btn.style.animation;
            btn.style.animation = 'none';
            btn.offsetHeight; // trigger reflow
            btn.style.animation = null;
        });
        
        // Also fix the navbar scroll state if restoring
        const navbar = document.querySelector('.navbar');
        if (navbar && window.scrollY > 50) {
            navbar.classList.add('scrolled');
            navbar.style.background = 'rgba(255, 255, 255, 0.85)';
            navbar.style.backdropFilter = 'blur(15px)';
            navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
        }
    }
});
