'use client';

import { useState, useMemo } from 'react';
import {
  Calculator,
  TrendingDown,
  ArrowRight,
  Building2,
  FileSpreadsheet,
  PiggyBank,
  Info,
  Users,
  AlertTriangle,
} from 'lucide-react';

// 부담기초액 구간별 (2025년 적용·2026년 신고)
const LEVY_RATES = {
  above75: { rate: 1258000, label: '3/4 이상 고용', surcharge: '기본' },
  above50: { rate: 1333480, label: '1/2~3/4 미달', surcharge: '6% 가산' },
  above25: { rate: 1509600, label: '1/4~1/2 미달', surcharge: '20% 가산' },
  below25: { rate: 1761200, label: '1/4 미달', surcharge: '40% 가산' },
  zero: { rate: 2096270, label: '0명 고용', surcharge: '최저임금' },
};

// 의무고용률
const MANDATORY_RATES = {
  private: { rate: 0.031, label: '민간기업 (3.1%)' },
  public: { rate: 0.038, label: '공공기관/국가·지자체 (3.8%)' },
};

// 월별 데이터 타입
interface MonthlyData {
  month: number;
  disabledWorkers: number;
  severeDisabled: number;
}

// 고용수준 판단
function getEmploymentLevel(mandatory: number, actual: number): keyof typeof LEVY_RATES {
  if (mandatory === 0) return 'above75';
  if (actual === 0) return 'zero';
  
  const ratio = actual / mandatory;
  
  if (ratio >= 0.75) return 'above75';
  if (ratio >= 0.5) return 'above50';
  if (ratio >= 0.25) return 'above25';
  return 'below25';
}

// 수급액비율 계산 (소수점 4자리)
function calculateSupplyRatio(contractAmount: number, totalRevenue: number): number {
  if (totalRevenue === 0) return 0;
  return Math.floor((contractAmount / totalRevenue) * 10000) / 10000;
}

// 2배수 적용 계산
function calculateDoubleCount(disabledWorkers: number, severeDisabled: number): number {
  return severeDisabled * 2 + (disabledWorkers - severeDisabled);
}

// 월별 감면액 계산 (10원 미만 버림)
function calculateMonthlyReduction(
  doubleCount: number,
  supplyRatio: number,
  levyBase: number
): number {
  return Math.floor((doubleCount * supplyRatio * levyBase) / 10) * 10;
}

// 최종 감면액 계산
function calculateFinalReduction(
  totalReduction: number,
  contractAmount: number,
  annualLevy: number,
  limit90: number = 0.9,
  limit50: number = 0.5
): number {
  const limitByContract = contractAmount * limit50;
  const limitByLevy = annualLevy * limit90;
  
  let result = totalReduction;
  if (result > limitByContract) result = limitByContract;
  if (result > limitByLevy) result = limitByLevy;
  
  return result;
}

// 금액 포맷
function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(amount));
}

// 억 단위 포맷
function formatBillion(amount: number): string {
  const billion = amount / 100000000;
  if (billion >= 1) {
    return `${billion.toFixed(1)}억원`;
  }
  const man = amount / 10000;
  if (man >= 1) {
    return `${new Intl.NumberFormat('ko-KR').format(Math.round(man))}만원`;
  }
  return formatKRW(amount) + '원';
}

export default function Home() {
  // 고객사 정보
  const [companyType, setCompanyType] = useState<'private' | 'public'>('private');
  const [totalEmployees, setTotalEmployees] = useState(500);
  const [currentDisabled, setCurrentDisabled] = useState(10);
  const [currentSevere, setCurrentSevere] = useState(3);
  
  // 연계고용 대상 사업체 정보 (BLUWEAR)
  const [totalRevenue, setTotalRevenue] = useState(300000000);
  const [contractAmount, setContractAmount] = useState(30000000);
  
  // 감면 한도
  const [limit90, setLimit90] = useState(0.9);
  const [limit50, setLimit50] = useState(0.5);
  
  // 월별 데이터 (1-12월)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>(
    Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      disabledWorkers: 10,
      severeDisabled: 5,
    }))
  );
  
  const [applyAllMonths, setApplyAllMonths] = useState(true);
  
  // 의무고용인원 계산
  const mandatoryEmployees = useMemo(() => {
    return Math.floor(totalEmployees * MANDATORY_RATES[companyType].rate);
  }, [totalEmployees, companyType]);
  
  // 고객사 장애인 2배수 적용
  const actualDoubleCount = useMemo(() => {
    return calculateDoubleCount(currentDisabled, currentSevere);
  }, [currentDisabled, currentSevere]);
  
  // 고용수준 판단
  const employmentLevel = useMemo(() => {
    return getEmploymentLevel(mandatoryEmployees, actualDoubleCount);
  }, [mandatoryEmployees, actualDoubleCount]);
  
  // 적용 부담기초액
  const levyBase = LEVY_RATES[employmentLevel].rate;
  
  // 미달인원
  const shortfall = useMemo(() => {
    return Math.max(0, mandatoryEmployees - actualDoubleCount);
  }, [mandatoryEmployees, actualDoubleCount]);
  
  // 연간 부담금액 (자동계산)
  const annualLevy = useMemo(() => {
    return shortfall * levyBase * 12;
  }, [shortfall, levyBase]);
  
  // 수급액 비율
  const supplyRatio = useMemo(() => {
    return calculateSupplyRatio(contractAmount, totalRevenue);
  }, [contractAmount, totalRevenue]);
  
  // 월별 계산 결과
  const monthlyResults = useMemo(() => {
    return monthlyData.map(data => {
      const doubleCount = calculateDoubleCount(data.disabledWorkers, data.severeDisabled);
      const monthlyReduction = calculateMonthlyReduction(doubleCount, supplyRatio, levyBase);
      return {
        ...data,
        doubleCount,
        monthlyReduction,
      };
    });
  }, [monthlyData, supplyRatio, levyBase]);
  
  // 감면 총액
  const totalReduction = useMemo(() => {
    return monthlyResults.reduce((sum, r) => sum + r.monthlyReduction, 0);
  }, [monthlyResults]);
  
  // 최종 감면액
  const finalReduction = useMemo(() => {
    return calculateFinalReduction(totalReduction, contractAmount, annualLevy, limit90, limit50);
  }, [totalReduction, contractAmount, annualLevy, limit90, limit50]);
  
  // 한도 정보
  const limitByContract = contractAmount * limit50;
  const limitByLevy = annualLevy * limit90;
  
  // 일괄 적용
  const handleBulkUpdate = (field: 'disabledWorkers' | 'severeDisabled', value: number) => {
    if (applyAllMonths) {
      setMonthlyData(prev => prev.map(d => ({ ...d, [field]: value })));
    } else {
      setMonthlyData(prev => {
        const updated = [...prev];
        updated[0] = { ...updated[0], [field]: value };
        return updated;
      });
    }
  };
  
  // 개별 월 업데이트
  const handleMonthUpdate = (month: number, field: 'disabledWorkers' | 'severeDisabled', value: number) => {
    setMonthlyData(prev => prev.map(d => 
      d.month === month ? { ...d, [field]: value } : d
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">BLUWEAR 연계고용 감면 계산기</h1>
                <p className="text-xs text-gray-500">장애인고용부담금 감면 시뮬레이션</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 결과 요약 카드 */}
        <div className="mb-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-xl">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-emerald-100 text-xs mb-1">연간 부담금</p>
              <p className="text-lg font-bold">{formatBillion(annualLevy)}</p>
            </div>
            <div>
              <p className="text-emerald-100 text-xs mb-1">감면 계산액</p>
              <p className="text-lg font-bold">{formatBillion(totalReduction)}</p>
            </div>
            <div>
              <p className="text-emerald-100 text-xs mb-1">도급액 50%</p>
              <p className="text-sm font-semibold">{formatBillion(limitByContract)}</p>
            </div>
            <div>
              <p className="text-emerald-100 text-xs mb-1">부담금 90%</p>
              <p className="text-sm font-semibold">{formatBillion(limitByLevy)}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <p className="text-emerald-100 text-xs mb-1">🎉 최종 감면액</p>
              <p className="text-2xl font-bold text-yellow-300">{formatBillion(finalReduction)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 좌측: 입력 섹션 */}
          <div className="lg:col-span-4 space-y-6">
            {/* 고객사 정보 */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                고객사 현황
              </h3>
              
              {/* 사업장 유형 */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">사업장 유형</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(MANDATORY_RATES).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setCompanyType(key as 'private' | 'public')}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        companyType === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <p className={`text-sm font-medium ${companyType === key ? 'text-blue-600' : 'text-gray-900'}`}>
                        {key === 'private' ? '민간기업' : '공공기관'}
                      </p>
                      <p className="text-xs text-gray-500">{(value.rate * 100).toFixed(1)}%</p>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">상시근로자 수</label>
                  <input
                    type="number"
                    value={totalEmployees}
                    onChange={(e) => setTotalEmployees(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">의무고용인원: {mandatoryEmployees}명</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">장애인 고용</label>
                    <input
                      type="number"
                      value={currentDisabled}
                      onChange={(e) => setCurrentDisabled(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">중증장애인</label>
                    <input
                      type="number"
                      value={currentSevere}
                      onChange={(e) => setCurrentSevere(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-900"
                    />
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-xl text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">2배수 적용</span>
                    <span className="font-medium text-gray-900">{actualDoubleCount}명</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">미달인원</span>
                    <span className="font-medium text-red-600">{shortfall}명</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 부담기초액 구간 */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                부담기초액 (2025)
              </h3>
              <div className="space-y-2">
                {Object.entries(LEVY_RATES).map(([key, value]) => (
                  <div
                    key={key}
                    className={`p-3 rounded-lg flex justify-between items-center ${
                      employmentLevel === key
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-medium ${employmentLevel === key ? 'text-blue-700' : 'text-gray-700'}`}>
                        {value.label}
                      </p>
                      <p className="text-xs text-gray-500">{value.surcharge}</p>
                    </div>
                    <p className={`font-semibold ${employmentLevel === key ? 'text-blue-700' : 'text-gray-600'}`}>
                      {formatKRW(value.rate)}원
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-700">
                  적용 부담기초액: <span className="font-bold text-lg">{formatKRW(levyBase)}원</span>
                </p>
              </div>
            </div>

            {/* 연계고용 대상 사업체 정보 */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                BLUWEAR 연계고용 정보
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-blue-100 mb-1">총 매출액 (A)</label>
                  <input
                    type="number"
                    value={totalRevenue}
                    onChange={(e) => setTotalRevenue(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white"
                  />
                  <p className="text-xs text-blue-200 mt-1">{formatBillion(totalRevenue)}</p>
                </div>
                <div>
                  <label className="block text-sm text-blue-100 mb-1">수급액 (B) - 도급금액</label>
                  <input
                    type="number"
                    value={contractAmount}
                    onChange={(e) => setContractAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white"
                  />
                  <p className="text-xs text-blue-200 mt-1">{formatBillion(contractAmount)}</p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <p className="text-sm">
                    수급액 비율 (B/A): <span className="font-bold text-xl">{(supplyRatio * 100).toFixed(2)}%</span>
                  </p>
                </div>
              </div>
            </div>

            {/* 감면 한도 */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-500" />
                감면 한도
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">발생부담금액의</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={limit90 * 100}
                      onChange={(e) => setLimit90((parseFloat(e.target.value) || 0) / 100)}
                      className="w-16 px-2 py-1 border border-gray-200 rounded text-center text-gray-900"
                    />
                    <span className="text-gray-600">% 이내</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">도급금액의</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={limit50 * 100}
                      onChange={(e) => setLimit50((parseFloat(e.target.value) || 0) / 100)}
                      className="w-16 px-2 py-1 border border-gray-200 rounded text-center text-gray-900"
                    />
                    <span className="text-gray-600">% 이내</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 우측: 월별 계산 테이블 */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                    월별 감면액 계산
                  </h3>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={applyAllMonths}
                      onChange={(e) => setApplyAllMonths(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-600">전체 월 일괄적용</span>
                  </label>
                </div>
                
                {applyAllMonths && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-700 mb-3">BLUWEAR 장애인 근로자 (전체 월 적용)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">장애인근로자수</label>
                        <input
                          type="number"
                          value={monthlyData[0].disabledWorkers}
                          onChange={(e) => handleBulkUpdate('disabledWorkers', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">중증장애인수</label>
                        <input
                          type="number"
                          value={monthlyData[0].severeDisabled}
                          onChange={(e) => handleBulkUpdate('severeDisabled', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">월</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">장애인근로자</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">중증</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">2배수적용</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">수급액비율</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">감면액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {monthlyResults.map((result) => (
                      <tr key={result.month} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{result.month}월</td>
                        <td className="px-4 py-3 text-right">
                          {!applyAllMonths ? (
                            <input
                              type="number"
                              value={result.disabledWorkers}
                              onChange={(e) => handleMonthUpdate(result.month, 'disabledWorkers', parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 border border-gray-200 rounded text-right text-sm text-gray-900"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{result.disabledWorkers}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!applyAllMonths ? (
                            <input
                              type="number"
                              value={result.severeDisabled}
                              onChange={(e) => handleMonthUpdate(result.month, 'severeDisabled', parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 border border-gray-200 rounded text-right text-sm text-gray-900"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{result.severeDisabled}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-blue-600">{result.doubleCount}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">{(supplyRatio * 100).toFixed(2)}%</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-emerald-600">{formatKRW(result.monthlyReduction)}원</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-right font-semibold text-gray-700">감면총액</td>
                      <td className="px-4 py-3 text-right font-bold text-lg text-gray-900">{formatKRW(totalReduction)}원</td>
                    </tr>
                    <tr className="bg-emerald-50">
                      <td colSpan={5} className="px-4 py-3 text-right font-semibold text-emerald-700">감면액 (한도적용)</td>
                      <td className="px-4 py-3 text-right font-bold text-xl text-emerald-600">{formatKRW(finalReduction)}원</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 계산식 설명 */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                <strong>※ 각 월 감면액 계산식:</strong>
              </p>
              <p className="text-sm text-gray-700 font-mono bg-white p-2 rounded">
                감면액 = ROUNDDOWN(부담기초액 × 수급액비율 × 장애인근로자수(2배수적용), -1)
              </p>
              <p className="text-sm text-gray-600 mt-3">
                <strong>※ 감면한도:</strong> 발생부담금액의 {(limit90 * 100).toFixed(0)}% 이내, 도급금액의 {(limit50 * 100).toFixed(0)}% 이내
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>※ 부담기초액:</strong> 고용 의무 이행 수준에 따라 자동 적용 (현재: {formatKRW(levyBase)}원 - {LEVY_RATES[employmentLevel].label})
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white text-center">
          <h3 className="font-semibold text-lg mb-2">BLUWEAR와 함께하세요!</h3>
          <p className="text-blue-100 text-sm mb-4">
            장애인고용부담금 감면과 ESG 경영 실현을 동시에!
          </p>
          <button className="px-8 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors inline-flex items-center gap-2">
            상담 신청하기
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500 border-t border-gray-100 pt-8">
          <p>© 2025 BLUWEAR. 장애인고용부담금 연계고용 감면 시뮬레이터</p>
          <p className="mt-1">
            본 계산기는 참고용이며, 실제 감면액은 한국장애인고용공단 심사 결과에 따라 달라질 수 있습니다.
          </p>
        </footer>
      </main>
    </div>
  );
}
