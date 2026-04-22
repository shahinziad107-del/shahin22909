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

});
