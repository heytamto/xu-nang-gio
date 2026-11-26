// src/components/admin/ConfigVoucherTab.jsx
import React, { useState } from "react";
import PaymentGiftConfigSection from "./PaymentGiftConfigSection";
import ShopGeneralConfigSection from "./ShopGeneralConfigSection";
import VoucherConfigSection from "./VoucherConfigSection";
import EmailTemplateConfigSection from "./EmailTemplateConfigSection";
import ShippingPolicyConfig from "./ShippingPolicyConfig";
import StorefrontSectionsConfig from "./StorefrontSectionsConfig";
import ConfirmModal from "../../../admin/components/ConfirmModal";

export default function ConfigVoucherTab({
  config = {},
  onSaveConfig,
  onShowAlert,
}) {
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);

  return (
    <div className="space-y-6 sm:space-y-7 font-sans animate-fadeIn text-stone-800">


      {/* 2. Cấu hình Quà tặng Thanh toán */}
      <PaymentGiftConfigSection
        onShowAlert={onShowAlert}
        setConfirmModalConfig={setConfirmModalConfig}
      />

      {/* 3. Cấu hình Vận hành, VietQR, Vận chuyển */}
      <ShopGeneralConfigSection
        initialConfig={config}
        onSaveConfig={onSaveConfig}
        onShowAlert={onShowAlert}
      />

      {/* 4. Cấu hình Mã Voucher */}
      <VoucherConfigSection
        onShowAlert={onShowAlert}
        setConfirmModalConfig={setConfirmModalConfig}
      />

      {/* 5. Cấu hình Email Templates */}
      <EmailTemplateConfigSection
        onShowAlert={onShowAlert}
      />

      <StorefrontSectionsConfig onShowAlert={onShowAlert} setConfirmModalConfig={setConfirmModalConfig} />

      <ShippingPolicyConfig onShowAlert={onShowAlert} setConfirmModalConfig={setConfirmModalConfig} />

      {/* Modal Xác Nhận Chung */}
      <ConfirmModal
        modalConfig={confirmModalConfig}
        onClose={() => setConfirmModalConfig(null)}
      />
    </div>
  );
}