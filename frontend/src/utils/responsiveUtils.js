import { useEffect, useState } from 'react';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/**
 * Hook to detect mobile devices
 */
export const useIsMobile = () => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('sm'));
};

/**
 * Hook to detect small screens
 */
export const useIsSmallScreen = () => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
};

/**
 * Hook to handle pull-to-refresh functionality
 */
export const usePullToRefresh = (callback) => {
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!callback) return;

    const handleTouchStart = (e) => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollTop <= 0) {
        setStartY(e.touches[0].clientY);
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling) return;
      
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollTop > 0) {
        setIsPulling(false);
        return;
      }
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff > 60) {
        setIsPulling(false);
        setRefreshing(true);
        
        // Call the refresh callback
        if (callback && typeof callback === 'function') {
          Promise.resolve(callback())
            .finally(() => {
              setTimeout(() => {
                setRefreshing(false);
              }, 1000);
            });
        } else {
          setTimeout(() => {
            setRefreshing(false);
          }, 1000);
        }
      }
    };

    const handleTouchEnd = () => {
      setIsPulling(false);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [callback, isPulling, startY]);

  return { refreshing };
};

/**
 * Formats a phone number for display
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
  } else {
    return phoneNumber;
  }
};

/**
 * Prepares a phone number for WhatsApp linking
 */
export const prepareWhatsAppNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  return phoneNumber.replace(/\D/g, '');
};

export default {
  useIsMobile,
  useIsSmallScreen,
  usePullToRefresh,
  formatPhoneNumber,
  prepareWhatsAppNumber
}; 