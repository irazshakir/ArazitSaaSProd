from django.db import models
from django.contrib.postgres.indexes import GinIndex

class LocationRouting(models.Model):
    tenant_id = models.CharField(max_length=255, db_index=True)
    locations = models.JSONField(default=dict)  # Using Django's built-in JSONField
    assigned_users = models.JSONField(default=dict)  # Using Django's built-in JSONField
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'location_routing'
        indexes = [
            models.Index(fields=['tenant_id']),
            GinIndex(fields=['locations']),  # Index for faster JSON search
            GinIndex(fields=['assigned_users']),  # Index for faster JSON search
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"Location Routing for Tenant: {self.tenant_id}"

    def get_next_available_user(self):
        """
        Returns the next available user based on round-robin assignment.
        Updates the assignment count in the process.
        """
        if not self.assigned_users:
            return None

        # Convert to list of tuples (user_id, count) and sort by count
        users = [(uid, data.get('count', 0)) 
                for uid, data in self.assigned_users.items()]
        users.sort(key=lambda x: x[1])

        # Get user with lowest count
        next_user_id = users[0][0]
        
        # Update the count for the selected user
        self.assigned_users[next_user_id]['count'] = users[0][1] + 1
        self.save()

        return next_user_id

    def add_location(self, city_name):
        """Add a new city to locations"""
        if not self.locations:
            self.locations = {}
        
        city_key = city_name.lower().strip()
        if city_key not in self.locations:
            self.locations[city_key] = {
                'name': city_name,
                'active': True,
                'added_at': str(self.updated_at)
            }
            self.save()
            return True
        return False

    def remove_location(self, city_name):
        """Remove a city from locations"""
        city_key = city_name.lower().strip()
        if city_key in self.locations:
            del self.locations[city_key]
            self.save()
            return True
        return False

    def add_user(self, user_id, user_name):
        """Add a new user to assigned_users"""
        if not self.assigned_users:
            self.assigned_users = {}
            
        if str(user_id) not in self.assigned_users:
            self.assigned_users[str(user_id)] = {
                'name': user_name,
                'count': 0,
                'active': True,
                'added_at': str(self.updated_at)
            }
            self.save()
            return True
        return False

    def remove_user(self, user_id):
        """Remove a user from assigned_users"""
        if str(user_id) in self.assigned_users:
            del self.assigned_users[str(user_id)]
            self.save()
            return True
        return False 