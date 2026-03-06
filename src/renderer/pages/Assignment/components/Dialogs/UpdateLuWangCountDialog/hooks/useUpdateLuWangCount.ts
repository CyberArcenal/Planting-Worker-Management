// src/renderer/pages/assignments/hooks/useUpdateLuWangCount.ts
import { useState, useEffect, useRef } from "react";
import { showError, showSuccess } from "../../../../../../utils/notification";
import { dialogs } from "../../../../../../utils/dialogs";
import { formatDecimalForInput } from "../../../../utils/formats";
import assignmentAPI from "../../../../../../api/core/assignment";

export const useUpdateLuWangCount = (
  assignmentId: number,
  assignmentName: string,
  currentLuWang: string,
  workerName?: string,
  pitakName?: string,
  assignmentDate?: string,
  onSuccess?: () => void,
  onClose?: () => void,
) => {
  const initialLuWang = parseFloat(currentLuWang) || 0;
  const [luwangCount, setLuwangCount] = useState(initialLuWang);
  const [inputValue, setInputValue] = useState(
    formatDecimalForInput(initialLuWang),
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    statistics?: any;
    recommendations?: any[];
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const formatDecimal = (num: number): string => {
    if (isNaN(num) || num === undefined || num === null) return "0.00";
    return new Intl.NumberFormat("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
      useGrouping: true,
    }).format(num);
  };

  const parseDecimal = (str: string): number => {
    const cleaned = str.replace(/,/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setInputValue("");
      setLuwangCount(0);
      return;
    }
    const decimalCount = (value.match(/\./g) || []).length;
    if (decimalCount > 1) return;
    const parts = value.split(".");
    if (parts.length === 2 && parts[1].length > 4) return;
    const num = parseDecimal(value);
    if (!isNaN(num)) {
      setInputValue(value);
      setLuwangCount(num);
    }
  };

  const handleInputBlur = () => {
    if (inputValue === "") {
      setInputValue("0.00");
      setLuwangCount(0);
      return;
    }
    const num = parseDecimal(inputValue);
    if (!isNaN(num)) {
      setInputValue(num.toFixed(2));
      setLuwangCount(num);
    }
  };

  const validateLuWangCount = async () => {
    if (Math.abs(luwangCount - initialLuWang) < 0.001) {
      setValidationResult(null);
      return;
    }
    setValidating(true);
    setError(null);
    try {
      const response = await assignmentAPI.validateLuWangCount(
        luwangCount,
        assignmentId,
      );
      if (response.status) {
        setValidationResult(response.data);
      } else {
        setError(response.message || "Validation failed");
      }
    } catch (err: any) {
      console.error("Validation error:", err);
      setValidationResult({ isValid: true, errors: [], warnings: [] });
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (Math.abs(luwangCount - initialLuWang) > 0.001) {
        validateLuWangCount();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [luwangCount]);

  const handleQuickAdjust = (adjustment: number, label: string) => {
    let newValue: number;
    if (label === "×2") {
      newValue = initialLuWang * 2;
    } else if (label === "÷2") {
      newValue = initialLuWang / 2;
    } else {
      newValue = luwangCount + adjustment;
    }
    if (newValue < 0) newValue = 0;
    setLuwangCount(newValue);
    setInputValue(newValue.toFixed(2));
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setLuwangCount(initialLuWang);
    setInputValue(formatDecimalForInput(initialLuWang));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.abs(luwangCount - initialLuWang) < 0.001) {
      setError("LuWang count is unchanged");
      return;
    }
    if (luwangCount < 0) {
      setError("LuWang count cannot be negative");
      return;
    }
    if (validationResult && !validationResult.isValid) {
      setError("Please fix validation errors before saving");
      return;
    }
    if (
      !(await dialogs.confirm({
        title: "Update LuWang Count",
        message: `Are you sure you want to update the LuWang count from ${formatDecimal(initialLuWang)} to ${formatDecimal(luwangCount)}?`,
      }))
    )
      return;

    setLoading(true);
    setError(null);
    try {
      const response = await assignmentAPI.updateLuWangCount(
        assignmentId,
        luwangCount,
        notes,
      );
      if (response.status) {
        showSuccess(
          `LuWang count updated from ${formatDecimal(initialLuWang)} to ${formatDecimal(luwangCount)}`,
        );
        if (onSuccess) onSuccess();
        onClose?.();
      } else {
        setError(response.message || "Failed to update LuWang count");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update LuWang count");
      showError("Failed to update LuWang count");
    } finally {
      setLoading(false);
    }
  };

  const changeAmount = luwangCount - initialLuWang;
  const hasChanged = Math.abs(changeAmount) > 0.001;
  const isIncrease = changeAmount > 0.001;
  const isDecrease = changeAmount < -0.001;
  const changePercentage =
    Math.abs(initialLuWang) < 0.001
      ? 0
      : (changeAmount / Math.abs(initialLuWang)) * 100;

  return {
    luwangCount,
    inputValue,
    notes,
    setNotes,
    loading,
    validating,
    error,
    validationResult,
    inputRef,
    handleInputChange,
    handleInputBlur,
    handleQuickAdjust,
    handleReset,
    handleSubmit,
    formatDecimal,
    hasChanged,
    isIncrease,
    isDecrease,
    changeAmount,
    changePercentage,
    assignmentName,
    workerName,
    pitakName,
    assignmentDate,
    initialLuWang,
    onClose,
  };
};
