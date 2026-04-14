from django.urls import path
from . import views

urlpatterns = [
    # This is our first user-facing API endpoint
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('orders/', views.OrderListCreateView.as_view(), name='order-list-create'),
    path('admin/analytics/', views.AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('admin/orders/', views.AdminOrderListView.as_view(), name='admin-orders'),
    path('admin/orders/<int:pk>/', views.AdminOrderUpdateView.as_view(), name='admin-order-update'),
    
    path('admin/products/', views.AdminProductListCreateView.as_view(), name='admin-products-list-create'),
    path('admin/products/<int:pk>/', views.AdminProductDetailView.as_view(), name='admin-products-detail'),

    path('upload/', views.CloudinaryUploadView.as_view(), name='cloudinary-upload'),
]