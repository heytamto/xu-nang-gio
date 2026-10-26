// src/repositories/baseRepository.js
import { supabase } from '../supabaseClient';
import { generatePrefixedDateId } from '../utils/idGenerator';

/**
 * Tạo repository tổng quát hỗ trợ nhiều chiến lược ID và tùy biến sắp xếp dữ liệu
 * @param {string} tableName - Tên bảng trong Supabase
 * @param {Object} options - Cấu hình chiến lược (strategy, prefix, orderBy, ascending, v.v.)
 */
export function createRepository(tableName, options = { strategy: 'db_uuid' }) {
  const defaultOrderBy = options.orderBy !== undefined ? options.orderBy : 'created_at';
  const defaultAscending = options.ascending ?? false;

  return {
    tableName,
    options,

    // 1. Lấy tất cả dữ liệu (có cơ chế tự fallback khi bảng không có created_at)
    async getAll(customOptions = {}) {
      const orderCol = customOptions.orderBy !== undefined ? customOptions.orderBy : defaultOrderBy;
      const isAsc = customOptions.ascending !== undefined ? customOptions.ascending : defaultAscending;

      let query = supabase.from(tableName).select(customOptions.select || '*');
      if (orderCol) {
        query = query.order(orderCol, { ascending: isAsc });
      }

      const { data, error } = await query;

      if (error) {
        // Mã 42703: Cột sắp xếp không tồn tại trong schema bảng
        if (error.code === '42703') {
          console.warn(`[${tableName}] Cột "${orderCol}" không tồn tại, tự động fallback sang "updated_at" hoặc không order.`);
          
          // Thử sắp xếp theo updated_at
          const retryWithUpdated = await supabase
            .from(tableName)
            .select(customOptions.select || '*')
            .order('updated_at', { ascending: isAsc });

          if (!retryWithUpdated.error) {
            return retryWithUpdated.data || [];
          }

          // Nếu vẫn không có updated_at, lấy toàn bộ bản ghi theo thứ tự mặc định của DB
          const plainQuery = await supabase.from(tableName).select(customOptions.select || '*');
          if (plainQuery.error) throw plainQuery.error;
          return plainQuery.data || [];
        }

        throw error;
      }

      return data || [];
    },

    // Lấy dữ liệu có phân trang và lọc (dành cho các bảng có nhiều bản ghi)
    async getPaginated(page = 1, pageSize = 10, filterQuery = null, customOptions = {}) {
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      const orderCol = customOptions.orderBy !== undefined ? customOptions.orderBy : defaultOrderBy;
      const isAsc = customOptions.ascending !== undefined ? customOptions.ascending : defaultAscending;

      let query = supabase
        .from(tableName)
        .select(customOptions.select || '*', { count: 'exact' })
        .range(start, end);

      if (orderCol) {
        query = query.order(orderCol, { ascending: isAsc });
      }

      // Nếu có điều kiện lọc tùy biến
      if (filterQuery) {
        query = filterQuery(query);
      }

      const { data, error, count } = await query;

      if (error) {
        if (error.code === '42703') {
          console.warn(`[${tableName}] getPaginated: Cột "${orderCol}" không tồn tại, fallback lấy không order.`);
          let fallbackQuery = supabase
            .from(tableName)
            .select(customOptions.select || '*', { count: 'exact' })
            .range(start, end);

          if (filterQuery) fallbackQuery = filterQuery(fallbackQuery);
          const fbRes = await fallbackQuery;
          if (fbRes.error) throw fbRes.error;

          return {
            data: fbRes.data || [],
            totalRecords: fbRes.count || 0,
            totalPages: Math.ceil((fbRes.count || 0) / pageSize),
            currentPage: page
          };
        }
        throw error;
      }

      return {
        data: data || [],
        totalRecords: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page
      };
    },

    // 2. Thêm mới với chiến lược ID tự động nhận diện
    async create(payload) {
      let finalPayload = { ...payload };

      // CHIẾN LƯỢC 1: Client sinh Prefix + Date + Retry (Dành riêng cho orders)
      if (options.strategy === 'client_retry') {
        const maxRetries = 5;
        let attempt = 0;

        while (attempt < maxRetries) {
          attempt++;
          const generatedCode = generatePrefixedDateId(options.prefix || 'XNG');
          finalPayload.code = generatedCode;

          const { data, error } = await supabase
            .from(tableName)
            .insert([finalPayload])
            .select()
            .single();

          if (!error) return data;

          if (error.code === '23505') {
            console.warn(`[${tableName}] Trùng mã ${generatedCode}, đang thử lại lần ${attempt}...`);
            continue;
          }
          throw error;
        }
        throw new Error(`Không thể tạo mã độc nhất cho ${tableName} sau nhiều lần thử.`);
      }

      // CHIẾN LƯỢC 2, 3, 4: 
      // - db_sequence (customers): Bỏ qua id để DB tự gọi generate_prefixed_id
      // - manual_slug (products, vouchers): Payload đã có sẵn id do admin nhập
      // - db_uuid (reviews, order_items): Bỏ qua id để DB tự sinh uuid
      const { data, error } = await supabase
        .from(tableName)
        .insert([finalPayload])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // 3. Cập nhật bản ghi
    async update(id, payload, idColumn = 'id') {
      const updateData = { ...payload };
      // Chỉ gán updated_at nếu payload chưa chỉ định
      if (updateData.updated_at === undefined) {
        updateData.updated_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq(idColumn, id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // 4. Xóa bản ghi
    async remove(id, idColumn = 'id') {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idColumn, id);

      if (error) throw error;
      return true;
    }
  };
}