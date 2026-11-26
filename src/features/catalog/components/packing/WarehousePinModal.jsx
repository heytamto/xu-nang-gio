// src/components/packing/WarehousePinModal.jsx
import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export default function WarehousePinModal({ validPin, onAuthenticated }) {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pinInput.trim() === validPin) {
      setPinError(false);
      onAuthenticated();
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 font-sans animate-fadeIn">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-stone-200/90 shadow-xl max-w-md w-full text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-stone-900">Mã PIN Kho Đóng Hàng</h2>
          <p className="text-sm text-stone-600 font-normal">Nhập mã PIN kho để mở bảng gom nông sản & in tem giao nhà xe</p>
        </div>
        <input
          type="password"
          maxLength={8}
          value={pinInput}
          autoFocus
          onChange={(e) => {
            setPinInput(e.target.value);
            if (pinError) setPinError(false);
          }}
          placeholder="Nhập mã PIN kho"
          className="w-full text-center text-2xl tracking-widest font-mono py-3.5 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-600 focus:outline-none font-black text-stone-900"
        />
        {pinError && <p className="text-sm text-rose-600 font-bold">Mã PIN không đúng, thử lại!</p>}
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-stone-900 hover:bg-amber-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          Mở Bảng Đóng Hàng
        </button>
      </form>
    </div>
  );
}