import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseRoute, buildRoute } from '../router';

export function useAppNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const route = useMemo(() => parseRoute(location.pathname, location.search), [location.pathname, location.search]);
  const [override, setOverride] = useState(null);
  const currentPage = override?.key === location.key ? override.page : route.page;
  const [highlightedProductId, setHighlightedProductId] = useState(null);
  const highlightTimerRef = useRef(null);
  useEffect(() => () => clearTimeout(highlightTimerRef.current), []);
  const setCurrentPage = useCallback(page => {
    if (['400', '404', '500'].includes(page)) setOverride({ key: location.key, page });
    else { setOverride(null); navigate(buildRoute(page)); }
  }, [location.key, navigate]);
  const navigateTo = useCallback(page => {
    setOverride(null);
    navigate(buildRoute(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigate]);
  const handleNavigateToShopCategory = useCallback((catId = 'all') => {
    setOverride(null);
    navigate(buildRoute('shop', catId));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigate]);
  const handleAnnouncementNavigate = useCallback(target => {
    clearTimeout(highlightTimerRef.current);
    handleNavigateToShopCategory(target?.category || 'all');
    setHighlightedProductId(target?.id || null);
    if (target?.id) highlightTimerRef.current = setTimeout(() => setHighlightedProductId(null), 3500);
  }, [handleNavigateToShopCategory]);
  return { currentPage, setCurrentPage, selectedShopCategory: route.category, highlightedProductId, initialLookupCode: route.code, navigateTo, handleNavigateToShopCategory, handleAnnouncementNavigate };
}
