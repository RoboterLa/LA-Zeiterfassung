'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log('🔍 Starting logout process...');
        
        // Call logout endpoint
        const response = await fetch('https://la-zeiterfassung-fyd4cge3d9e3cac4.azurewebsites.net/logout', {
          method: 'GET',
          credentials: 'include',
        });
        
        console.log('🔍 Logout response status:', response.status);
        
        // Clear any local storage or session storage if needed
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          
          // Cookies explizit löschen
          document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
          });
        }
        
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Redirect to login page with hard refresh to clear cache
        console.log('🔍 Redirecting to login with hard refresh...');
        window.location.href = '/login';
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Sie werden abgemeldet...</p>
      </div>
    </div>
  );
} 