import glob

new_modal = """
    <!-- Modern Search Modal -->
    <div class="modal fade search-bottom-sheet" id="searchModal" tabindex="-1" aria-labelledby="searchModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                <div class="modal-header flex-column text-center">
                    <div class="p-3 rounded-circle bg-light mb-3" style="width: 80px; height: 80px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px rgba(59,130,246,0.2);">
                        <i class="fa-solid fa-magnifying-glass fs-1 text-primary"></i>
                    </div>
                    <h5 class="modal-title" id="searchModalLabel">البحث المتقدم</h5>
                    <p class="text-muted mt-2 mb-0">ابحث عن العقار المناسب لك بضغطة زر</p>
                </div>
                <div class="modal-body p-4 p-md-5">
                    <form id="search-form" class="row g-4">
                        <div class="col-md-6">
                            <label class="form-label fw-bold"><i class="fa-solid fa-map-location-dot text-primary ms-1"></i> المحافظة</label>
                            <select id="search-governorate" class="form-select">
                                <option value="" selected>كل المحافظات</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold"><i class="fa-solid fa-city text-primary ms-1"></i> المدينة / المنطقة</label>
                            <select id="search-city" class="form-select" disabled>
                                <option value="" selected>كل المدن</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold"><i class="fa-solid fa-money-bill-wave text-success ms-1"></i> السعر من (ج.م)</label>
                            <input type="number" id="search-min-price" class="form-control" placeholder="الحد الأدنى للسعر">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold"><i class="fa-solid fa-money-bill-wave text-danger ms-1"></i> السعر إلى (ج.م)</label>
                            <input type="number" id="search-max-price" class="form-control" placeholder="الحد الأقصى للسعر">
                        </div>
                        <div class="col-12 mt-5 text-center">
                            <button type="submit" class="btn btn-primary btn-search-submit w-100 py-3">
                                <i class="fa-solid fa-rocket ms-2"></i> ابدأ البحث
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
"""

for filepath in glob.glob('*.html'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    start_tag = '<div class="modal fade search-bottom-sheet" id="searchModal"'
    end_tag = '<!-- Summer Search Modal -->'
    
    if start_tag in content and end_tag in content:
        start_idx = content.find(start_tag)
        end_idx = content.find(end_tag)
        
        new_content = content[:start_idx] + new_modal + '\n    ' + content[end_idx:]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Updated modal in', filepath)
