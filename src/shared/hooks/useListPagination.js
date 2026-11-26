import { useEffect, useMemo, useState } from 'react';
import { paginateList } from '../utils/listPagination.js';
export function useListPagination(rows, resetKey = '') {
  const [pageSize, setSize] = useState(6);
  const [position, setPosition] = useState({ key: resetKey, page: 1 });
  const result = useMemo(() => paginateList(rows, position.key === resetKey ? position.page : 1, pageSize), [rows, position, resetKey, pageSize]);
  useEffect(() => {
    if (position.key !== resetKey || position.page !== result.currentPage) setPosition({ key: resetKey, page: result.currentPage });
  }, [position, resetKey, result.currentPage]);
  return { result, pageSize, setPage: page => setPosition({ key: resetKey, page }), setPageSize: size => { setSize(size); setPosition({ key: resetKey, page: 1 }); } };
}
