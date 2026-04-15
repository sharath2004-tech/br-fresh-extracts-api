from rest_framework import serializers
from .models import Product, Order, OrderItem, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'image', 'icon']


class ProductSerializer(serializers.ModelSerializer):
    category = serializers.StringRelatedField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'category', 'price', 'image', 'in_stock', 'featured', 'weight', 'variants']
    
class OrderItemSerializer(serializers.ModelSerializer):
    """
    A 'read-only' serializer to show items *inside* an order.
    """
    # We want to show the product's name, not just its ID
    product = serializers.StringRelatedField() 
    class Meta:
        model = OrderItem
        fields = ['product', 'quantity', 'price_at_time']


class OrderSerializer(serializers.ModelSerializer):
    """
    A 'read-only' serializer for the "My Orders" list.
    """
    # We use the serializer from above to nest the items
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 
            'status', 
            'created_at', 
            'total_amount', 
            'payment_mode',
            'items' # This is the nested list of items
        ]


class CreateOrderItemSerializer(serializers.Serializer):
    """
    A 'write-only' serializer to validate items 
    sent by the user during checkout.
    """
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class CreateOrderSerializer(serializers.Serializer):
    """
    The main serializer for the "Place Order" endpoint.
    It takes a list of items to create a new order.
    """
    items = CreateOrderItemSerializer(many=True)

    def create(self, validated_data):
        # We get the logged-in user from the 'context' 
        # which is passed by the view.
        user = self.context['request'].user
        items_data = validated_data['items']

        total_amount = 0

        # Start a database transaction
        # from django.db import transaction
        # with transaction.atomic():

        # Create the main Order object
        order = Order.objects.create(
            user=user,
            payment_mode='COD' # As requested
        )

        items_to_create = []

        # Loop through items from the cart
        for item_data in items_data:
            try:
                product = Product.objects.get(id=item_data['product_id'], in_stock=True)
            except Product.DoesNotExist:
                # If any product doesn't exist or is out of stock,
                # we raise an error.
                order.delete() # Clean up the created order
                raise serializers.ValidationError(f"Product with id {item_data['product_id']} not available.")

            price = product.price
            total_amount += (price * item_data['quantity'])

            # Add new OrderItem to our list
            items_to_create.append(
                OrderItem(
                    order=order,
                    product=product,
                    quantity=item_data['quantity'],
                    price_at_time=price
                )
            )

        # Create all OrderItem objects in one go (efficient)
        OrderItem.objects.bulk_create(items_to_create)

        # Update the order's total amount
        order.total_amount = total_amount
        order.save()

        return order

class AdminOrderSerializer(serializers.ModelSerializer):
    # Pull details from the related User object
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    user_address = serializers.CharField(source='user.address', read_only=True)
    user_location_lat = serializers.CharField(source='user.latitude', read_only=True)
    user_location_lng = serializers.CharField(source='user.longitude', read_only=True)
    
    # Reuse the existing item serializer
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 
            'user_name', 
            'user_phone', 
            'user_address', 
            'user_location_lat',
            'user_location_lng',
            'total_amount', 
            'status', 
            'payment_mode', 
            'created_at', 
            'items'
        ]