"""
URL configuration for fresh_oils_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
import traceback

def health_check(request):
    """Diagnostic endpoint to check DB connectivity."""
    checks = {}
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks['db'] = 'ok'
    except Exception as e:
        checks['db'] = f'error: {e}'
    try:
        from store.models import Product, Category
        checks['product_count'] = Product.objects.count()
        checks['category_count'] = Category.objects.count()
    except Exception as e:
        checks['query_error'] = traceback.format_exc()
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
            )
            checks['tables'] = [row[0] for row in cursor.fetchall()]
    except Exception as e:
        checks['tables_error'] = str(e)
    return JsonResponse(checks)

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/', include('store.urls')),
    path('api/auth/', include('accounts.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path(
        'api/schema/swagger-ui/', 
        SpectacularSwaggerView.as_view(url_name='schema'), 
        name='swagger-ui'
    ),
]
