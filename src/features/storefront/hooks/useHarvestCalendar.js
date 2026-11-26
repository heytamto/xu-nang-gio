import { useState, useMemo, useRef, useEffect } from "react";
import { MONTHLY_HARVEST_CALENDAR } from "../data/harvestCalendar";

export function useHarvestCalendar() {
  const currentRealMonth = useMemo(() => new Date().getMonth() + 1, []);
  const [selectedMonth, setSelectedMonth] = useState(currentRealMonth);
  const [isFlipped, setIsFlipped] = useState(false);

  // State hiệu ứng nhấn lún đàn hồi
  const [isPressing, setIsPressing] = useState(false);
  const pressTimerRef = useRef(null);

  const activeMonthData = useMemo(() => {
    return (
      MONTHLY_HARVEST_CALENDAR.find((m) => m.month === selectedMonth) ||
      MONTHLY_HARVEST_CALENDAR[0]
    );
  }, [selectedMonth]);

  // Click chọn tháng hoặc lật thẻ khi click vào thẻ đang mở
  const handleCardClick = (month) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    if (selectedMonth === month) {
      setIsPressing(true);
      pressTimerRef.current = setTimeout(() => {
        setIsFlipped((prev) => !prev);
        setIsPressing(false);
      }, 160);
    } else {
      setIsPressing(true);
      pressTimerRef.current = setTimeout(() => {
        setSelectedMonth(month);
        setIsFlipped(false);
        setIsPressing(false);
      }, 130);
    }
  };

  const handlePrevMonth = () => {
    const prev = selectedMonth === 1 ? 12 : selectedMonth - 1;
    handleCardClick(prev);
  };

  const handleNextMonth = () => {
    const next = selectedMonth === 12 ? 1 : selectedMonth + 1;
    handleCardClick(next);
  };

  useEffect(() => () => clearTimeout(pressTimerRef.current), []);

  // Điều hướng bằng bàn phím
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") handlePrevMonth();
      if (e.key === "ArrowRight") handleNextMonth();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMonth]);

  return { currentRealMonth, selectedMonth, isFlipped, isPressing, activeMonthData, handleCardClick, handlePrevMonth, handleNextMonth };
}
