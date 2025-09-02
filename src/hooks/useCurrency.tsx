import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Conversion rate from USD
}

const currencies: Record<string, CurrencyInfo> = {
  IN: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83 },
  US: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  GB: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  EU: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  CA: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.35 },
  AU: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.52 },
  SG: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 1.34 },
  AE: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 3.67 },
  default: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83 } // Default to INR
};

export const useCurrency = () => {
  const [currency, setCurrency] = useState<CurrencyInfo>(currencies.default);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectCurrency = async () => {
      try {
        // First, try to get admin-configured currency from agency settings
        const { data: agencyData } = await supabase
          .from('agency_settings')
          .select('default_currency')
          .limit(1)
          .single();

        if (agencyData?.default_currency && currencies[agencyData.default_currency]) {
          setCurrency(currencies[agencyData.default_currency]);
          setLoading(false);
          return;
        }

        // Fallback to IP geolocation detection
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          const countryCode = data.country_code;
          
          // Map some common European countries to EU
          const europeanCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'EE', 'LV', 'LT', 'SK', 'SI', 'MT', 'CY', 'LU'];
          const mappedCode = europeanCountries.includes(countryCode) ? 'EU' : countryCode;
          
          const detectedCurrency = currencies[mappedCode] || currencies.default;
          setCurrency(detectedCurrency);
        } else {
          // Final fallback to default currency (INR)
          setCurrency(currencies.default);
        }
      } catch (error) {
        console.log('Currency detection failed, using default (INR):', error);
        setCurrency(currencies.default);
      } finally {
        setLoading(false);
      }
    };

    detectCurrency();
  }, []);

  const convertPrice = (usdPrice: number): number => {
    return Math.round(usdPrice * currency.rate);
  };

  const formatPrice = (usdPrice: number): string => {
    const convertedPrice = convertPrice(usdPrice);
    
    // Format based on currency
    if (currency.code === 'INR') {
      // Indian number formatting (lakhs/crores)
      return `${currency.symbol}${convertedPrice.toLocaleString('en-IN')}`;
    } else {
      return `${currency.symbol}${convertedPrice.toLocaleString()}`;
    }
  };

  const changeCurrency = (countryCode: string) => {
    const newCurrency = currencies[countryCode] || currencies.default;
    setCurrency(newCurrency);
  };

  return {
    currency,
    loading,
    convertPrice,
    formatPrice,
    changeCurrency,
    availableCurrencies: currencies
  };
};