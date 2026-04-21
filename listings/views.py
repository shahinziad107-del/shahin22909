from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.models import User
from .models import Property

def login_view(request):
    return render(request, 'listings/login.html')

def property_list(request):
    properties = Property.objects.all().order_by('-created_at')
    return render(request, 'listings/property_list.html', {'properties': properties})

def property_detail(request, pk):
    property = get_object_or_404(Property, pk=pk)
    return render(request, 'listings/property_detail.html', {'property': property})

def account_view(request):
    return render(request, 'listings/account.html')

def add_property_view(request):
    if request.method == 'POST':
        title = request.POST.get('title')
        price = request.POST.get('price')
        location = request.POST.get('location')
        description = request.POST.get('description')
        image = request.FILES.get('image')
        
        owner = request.user if request.user.is_authenticated else User.objects.first()
        if not owner:
            owner = User.objects.create_superuser('admin', 'admin@ajarli.com', 'admin')
            
        Property.objects.create(
            title=title, price=price, location=location, 
            description=description, image=image, owner=owner
        )
        return redirect('property_list')
    return render(request, 'listings/add_property.html')

def my_properties_view(request):
    # Retrieve properties belonging to the user
    # properties = Property.objects.filter(owner=request.user)
    properties = Property.objects.all().order_by('-created_at') # Dummy implementation to show UI
    return render(request, 'listings/my_properties.html', {'properties': properties})
