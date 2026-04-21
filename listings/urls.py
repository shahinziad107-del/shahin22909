from django.urls import path
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),
    path('home/', views.property_list, name='property_list'),
    path('property/<int:pk>/', views.property_detail, name='property_detail'),
    path('account/', views.account_view, name='account'),
    path('add/', views.add_property_view, name='add_property'),
]
