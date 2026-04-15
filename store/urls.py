from django.urls import path
from . import views

urlpatterns = [
    # Public endpoints
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('orders/', views.OrderListCreateView.as_view(), name='order-list-create'),

    # Admin analytics & orders
    path('admin/analytics/', views.AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('admin/orders/', views.AdminOrderListView.as_view(), name='admin-orders'),
    path('admin/orders/<int:pk>/', views.AdminOrderUpdateView.as_view(), name='admin-order-update'),

    # Admin category CRUD
    path('admin/categories/', views.AdminCategoryListCreateView.as_view(), name='admin-categories-list-create'),
    path('admin/categories/<int:pk>/', views.AdminCategoryDetailView.as_view(), name='admin-categories-detail'),

    # Admin product CRUD
    path('admin/products/', views.AdminProductListCreateView.as_view(), name='admin-products-list-create'),
    path('admin/products/<int:pk>/', views.AdminProductDetailView.as_view(), name='admin-products-detail'),

    path('upload/', views.CloudinaryUploadView.as_view(), name='cloudinary-upload'),
]