from rest_framework import viewsets, permissions
from .models import GeneralProduct
from .serializers import GeneralProductSerializer

class GeneralProductViewSet(viewsets.ModelViewSet):
    """ViewSet for the GeneralProduct model."""
    
    queryset = GeneralProduct.objects.all()
    serializer_class = GeneralProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter products by the authenticated user's tenant.
        """
        user = self.request.user
        if user.is_superuser:
            return GeneralProduct.objects.all()
        
        return GeneralProduct.objects.filter(tenant_id=user.tenant_id)
    
    def perform_create(self, serializer):
        """
        Create a new product for the current tenant.
        """
        serializer.save(tenant_id=self.request.user.tenant_id) 