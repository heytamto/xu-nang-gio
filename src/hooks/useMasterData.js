// src/hooks/useMasterData.js
import { useState, useEffect, useCallback } from 'react';
import { productRepo, shopConfigRepo } from '../repositories';

export function useMasterData() {
  const [products, setProducts] = useState([]);
  const [shopConfig, setShopConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMasterData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi song song qua Repository Layer
      const [productsData, configsData] = await Promise.all([
        productRepo.getAllWithWeights(),
        shopConfigRepo.getAll()
      ]);

      setProducts(productsData || []);

      // Parse danh sách key-value của shop_configs thành 1 object duy nhất
      const configMap = {};
      if (Array.isArray(configsData)) {
        configsData.forEach((row) => {
          let val = row.value;
          if (typeof val === 'string') {
            try {
              val = JSON.parse(val);
            } catch {
              // giữ nguyên chuỗi nếu không phải JSON
            }
          }
          configMap[row.key] = val;
        });
      }
      setShopConfig(configMap);
    } catch (err) {
      console.error('Lỗi nạp master data:', err);
      setError(err.message || 'Không thể tải dữ liệu cửa hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  return {
    products,
    shopConfig,
    loading,
    error,
    refreshMasterData: fetchMasterData
  };
}