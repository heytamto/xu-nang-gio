# Xứ Nắng Gió — Performance & Reliability, đợt 1

Baseline audit: xunanggio_config_cleanup.zip (không phải working tree hiện tại), weather patch trước đó. Không ghi đè App, checkout, admin layout hoặc các migration nghiệp vụ cũ.

## Apply
1. Nếu chưa chạy, chạy `supabase/migrations/20261128000000_weather.sql` trong Supabase SQL Editor. Sau đó chạy `20261128010000_weather_cache.sql`. Không chạy test trên production.
2. Copy api/weather.js và các file src trong patch. Nếu chưa tích hợp weather: import WeatherSection vào HomePage, đặt ngay sau Hero; import WeatherConfigSection trong ConfigVoucherTab, đặt cạnh ShippingPolicyConfig. Không cần thay đổi các file đó nếu đã tích hợp.
3. Vercel environment variables (server only): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WEATHERAPI_KEY. Service role có quyền rộng: tuyệt đối không dùng VITE_ prefix, không commit, không log. API chỉ nhận GET không query; không chuyển input người dùng vào RPC hoặc provider. Có thể xóa OPEN_METEO_API_KEY nếu không còn dùng ở nơi khác.
4. `node --test tests/weather-cache.mjs`; `npm run build`; deploy; bật Weather trong Admin. Kiểm tra /api/weather và cache headers. Vite dev thường không có server API; dùng môi trường Vercel.
5. Chạy `supabase/tests/weather_cache_test.sql` tại staging; test tuần tự có rollback. Concurrency thực: staging cold cache, gửi đồng thời 100 GET qua nhiều instance, đối chiếu log nhà cung cấp và weather_cache; không reset cache production. Test unit mô phỏng RPC không chứng minh lock thật.

## Policy
- Provider WeatherAPI, một vị trí từ cấu hình. PostgreSQL TTL 15 phút, stale tối đa 2 giờ kể từ lần fetch, lease 30 giây, timeout provider 8 giây, backoff 5/10/20/30 phút. Lock token chống ghi kết quả từ worker cũ. CDN tối đa 60 giây fresh, 10 giây stale, 5 giây pending. Frontend 5 phút, pending 30 giây; storefront chỉ gọi một endpoint thay vì đọc cấu hình riêng rồi gọi endpoint. Admin vẫn có RPC riêng.
- Worker giành lease phải chờ provider; request khác nhận stale/pending. Không background promise không đảm bảo trên serverless. Không bảo đảm exactly-once nếu worker bị treo quá lease hoặc request upstream vẫn chạy sau timeout. Chỉ một worker hợp lệ trong mỗi lease. Không Redis/Cron.
- Cache per location/config coordinates/timezone; dữ liệu địa điểm cũ không dùng cho key mới. CDN và browser có thể giữ config cũ đến TTL. Dữ liệu weather local time do provider xác định theo tọa độ; timezone config không ép provider đổi timezone.
- API lỗi hoặc cache quá hạn: frontend ẩn hoặc hiện trạng thái cập nhật, không làm hỏng trang. Chưa có kiểm thử browser/CLS.

## Audit findings (baseline)
- useStorefrontData đã tách catalog/content/config, content chỉ tải ở story/admin, snapshot catalog/content và debounce realtime 250ms. Không viết lại. Config khởi tạo stale để lấy thông tin thanh toán mới; không kéo dài TTL một cách mù quáng. Catalog vẫn lấy toàn bộ products+weights, cần đo kích thước thực trước khi phân trang vì cart sync phụ thuộc danh sách đầy đủ. Mỗi browser vẫn có realtime subscription; đo số kết nối trước khi đổi.
- Checkout/Inventory/Voucher/Payment/Email có migration và regression suite từ các phase trước. Chưa chứng minh concurrency DB trên production. Không đổi atomic RPC hay cấp quyền mới ngoài weather.
- ImageUploadField bản baseline đã nén JPEG max width 1200px và cache 1 năm. Kiểm tra bản hiện tại trước khi thay đổi; logo cần alpha, review/packing cần giữ private/signed URL. Không ghi đè từ bản cũ.
- Dashboard/index: dùng performance_readonly.sql để thu thống kê, sau đó EXPLAIN ANALYZE trên staging cho query cụ thể; không thêm index mù.
- Regression baseline 89/89, weather unit 5/5. Chưa chạy production build, SQL runtime, live provider, browser hay load test DB. Không tuyên bố tối ưu toàn hệ thống đã hoàn tất.
