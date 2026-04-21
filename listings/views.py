from django.shortcuts import render, get_object_or_404
from .models import Property

def property_list(request):
    properties = Property.objects.all().order_by('-created_at')
    return render(request, 'listings/property_list.html', {'properties': properties})

def property_detail(request, pk):
    property = get_object_or_404(Property, pk=pk)
    return render(request, 'listings/property_detail.html', {'property': property})

def account_view(request):
    return render(request, 'listings/account.html')
