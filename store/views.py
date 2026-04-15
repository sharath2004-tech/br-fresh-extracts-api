# store/views.py

import cloudinary
import cloudinary.uploader
from django.conf import settings
from django.db.models import Sum
from rest_framework.generics import ListAPIView,ListCreateAPIView,RetrieveUpdateDestroyAPIView,RetrieveUpdateAPIView
from rest_framework.parsers import MultiPartParser
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny,IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from .models import Product, Order, Category
from .serializers import ProductSerializer, OrderSerializer, CreateOrderSerializer, CategorySerializer
from .serializers import AdminOrderSerializer
import os


def _check_secret(request):
    """Returns True if the request carries the correct X-Upload-Secret header (or no secret is configured)."""
    secret = os.environ.get('UPLOAD_SECRET', '')
    if not secret:
        return True
    return request.headers.get('X-Upload-Secret') == secret

class ProductListView(ListAPIView):
    """
    A read-only API endpoint that lists all in-stock products.
    This is what your homepage will use.
    """

    # We only want to show products that are in stock
    queryset = Product.objects.filter(in_stock=True)

    # Tell this view to use the serializer we just created
    serializer_class = ProductSerializer

    # For now, anyone can view the products
    permission_classes = [AllowAny]

class OrderListCreateView(ListCreateAPIView):
    """
    A single endpoint for:
    GET: Listing the user's past orders ("My Orders")
    POST: Creating a new order ("Place Order")
    """
    # This is the magic! This endpoint requires a valid JWT token.
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        # Use a different serializer for POST vs GET
        if self.request.method == 'POST':
            return CreateOrderSerializer
        return OrderSerializer

    def get_queryset(self):
        # This ensures users can ONLY see their *own* orders
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # Pass the request (which contains the user) 
        # to the serializer's create method
        serializer.save(user=self.request.user)

class AdminAnalyticsView(APIView):
    """
    Returns business metrics for the Admin Dashboard.
    Only accessible by Staff/Superusers.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        # 1. Calculate Totals
        total_orders = Order.objects.count()
        
        # Sum the 'total_amount' column (handle None if no orders exist)
        revenue_data = Order.objects.aggregate(Sum('total_amount'))
        total_revenue = revenue_data['total_amount__sum'] or 0
        
        # Count orders by status
        pending_orders = Order.objects.filter(status='Pending').count()
        completed_orders = Order.objects.filter(status='Delivered').count()

        return Response({
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'pending_orders': pending_orders,
            'completed_orders': completed_orders,
        })

class AdminOrderListView(ListAPIView):
    """
    Returns ALL orders for the Admin Portal.
    """
    permission_classes = [IsAdminUser]
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = AdminOrderSerializer

class AdminOrderUpdateView(RetrieveUpdateAPIView):
    """
    Allows Admin to update specific fields of an order (like status).
    """
    permission_classes = [IsAdminUser]
    serializer_class = AdminOrderSerializer
    queryset = Order.objects.all()
    # We only want to allow updating 'status' ideally, 
    # but using the main serializer is fine for now.


# --- 2. ADMIN PRODUCT MANAGEMENT (CRUD) ---

# --- CATEGORY VIEWS ---

class CategoryListView(ListAPIView):
    """Public category list — used by the customer-facing site."""
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer
    queryset = Category.objects.all()


class AdminCategoryListCreateView(APIView):
    """Admin: list all categories (GET) or create one (POST)."""
    permission_classes = [AllowAny]

    def get(self, request):
        if not _check_secret(request):
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = CategorySerializer(Category.objects.all(), many=True)
        return Response(serializer.data)

    def post(self, request):
        if not _check_secret(request):
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminCategoryDetailView(APIView):
    """Admin: update (PUT) or delete (DELETE) a single category."""
    permission_classes = [AllowAny]

    def get_object(self, pk):
        try:
            return Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return None

    def put(self, request, pk):
        if not _check_secret(request):
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)
        obj = self.get_object(pk)
        if obj is None:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CategorySerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not _check_secret(request):
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)
        obj = self.get_object(pk)
        if obj is None:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- ADMIN PRODUCT VIEWS ---

class AdminProductListCreateView(APIView):
    """Admin: list all products (GET) or create one (POST)."""
    permission_classes = [AllowAny]

    def get(self, request):
        if not _check_secret(request):
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProductSerializer(Product.objects.all().order_by('-created_at'), many=True)
        return Response(serializer.data)

    def post(self, request):
        if not _check_secret(request):
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            category_obj = None
            category_name = request.data.get('category', '')
            if category_name:
                category_obj, _ = Category.objects.get_or_create(name=category_name)
            instance = serializer.save(category=category_obj)
            return Response(ProductSerializer(instance).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminProductDetailView(APIView):
    """Admin: update (PUT) or delete (DELETE) a single product."""
    permission_classes = [AllowAny]

    def get_object(self, pk):
        try:
            return Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return None

    def put(self, request, pk):
        if not _check_secret(request):
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)
        obj = self.get_object(pk)
        if obj is None:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            category_name = request.data.get('category', '')
            if category_name:
                category_obj, _ = Category.objects.get_or_create(name=category_name)
                instance = serializer.save(category=category_obj)
            else:
                instance = serializer.save()
            return Response(ProductSerializer(instance).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not _check_secret(request):
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)
        obj = self.get_object(pk)
        if obj is None:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CloudinaryUploadView(APIView):
    """
    POST /api/upload/
    Accepts a multipart image file, uploads it to Cloudinary using server-side credentials,
    and returns the secure CDN URL.
    Protected by a shared secret header: X-Upload-Secret.
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser]

    def post(self, request):
        import os
        secret = os.environ.get('UPLOAD_SECRET', '')
        if secret and request.headers.get('X-Upload-Secret') != secret:
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        cfg = settings.CLOUDINARY_STORAGE
        cloudinary.config(
            cloud_name=cfg.get('CLOUD_NAME'),
            api_key=cfg.get('API_KEY'),
            api_secret=cfg.get('API_SECRET'),
            secure=True,
        )

        result = cloudinary.uploader.upload(
            file,
            folder='br-fresh-extracts',
            resource_type='image',
        )
        return Response({'url': result['secure_url']}, status=status.HTTP_200_OK)