// components/Payment/components/PaymentStats.tsx
import React from "react";
import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";
import type { PaymentStats as PaymentStatsData } from "../../../api/core/payment";



interface PaymentStatsProps {
  stats: PaymentStatsData | null;
  summary: { totalGross: number; totalNet: number; totalDeductions: number } | null;
}

const PaymentStats: React.FC<PaymentStatsProps> = ({ stats, summary }) => {
  const pendingCount = stats?.statusBreakdown?.pending || 0;
  const processingCount = stats?.statusBreakdown?.processing || 0;
  const completedCount = stats?.statusBreakdown?.completed || 0;
  const cancelledCount = stats?.statusBreakdown?.cancelled || 0;

  return (
    <>
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg bg-white border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-green-50">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
              Total
            </span>
          </div>
          <h3 className="text-3xl font-bold mb-1 text-gray-800">
            {formatCurrency(summary?.totalNet || 0)}
          </h3>
          <p className="text-sm text-gray-600">Total Net Paid</p>
        </div>

        <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg bg-white border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
              Gross
            </span>
          </div>
          <h3 className="text-3xl font-bold mb-1 text-gray-800">
            {formatCurrency(summary?.totalGross || 0)}
          </h3>
          <p className="text-sm text-gray-600">Total Gross Pay</p>
        </div>

        <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg bg-white border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-amber-50">
              <TrendingDown className="w-6 h-6 text-amber-600" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
              Deductions
            </span>
          </div>
          <h3 className="text-3xl font-bold mb-1 text-gray-800">
            {formatCurrency(summary?.totalDeductions || 0)}
          </h3>
          <p className="text-sm text-gray-600">Total Deductions</p>
        </div>

        <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg bg-white border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg bg-purple-50">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-600">
              Average
            </span>
          </div>
          <h3 className="text-3xl font-bold mb-1 text-gray-800">
            {formatCurrency(stats?.averagePayment || 0)}
          </h3>
          <p className="text-sm text-gray-600">Average Payment</p>
        </div>
      </div>

      {/* Status Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg bg-white border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm font-medium text-gray-700">Pending</span>
            </div>
            <span className="text-2xl font-bold text-yellow-600">{pendingCount}</span>
          </div>
        </div>

        <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg bg-white border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium text-gray-700">Processing</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">{processingCount}</span>
          </div>
        </div>

        <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg bg-white border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">Completed</span>
            </div>
            <span className="text-2xl font-bold text-green-600">{completedCount}</span>
          </div>
        </div>

        <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg bg-white border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm font-medium text-gray-700">Cancelled</span>
            </div>
            <span className="text-2xl font-bold text-red-600">{cancelledCount}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentStats;