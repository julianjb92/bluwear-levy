'use client';

import { useState, useEffect } from 'react';
import {
  calculateReduction,
  formatKRW,
  formatBillion,
  getEmploymentLevelLabel,
  LEVY_BASE_2025,
  MANDATORY_RATE,
  CompanyInput,
  BluwearInput,
  CalculationResult,
} from '@/lib/calculator';
import {
  Building2,
  Users,
  Calculator,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  FileText,
  HelpCircle,
} from 'lucide-react';

export default function Home() {
  const [companyType, setCompanyType] = useState<'private' | 'public' | 'government'>('private');
  const [company, setCompany] = useState<CompanyInput>({
    type: 'private',
    totalEmployees: 500,
    disabledEmployees: 10,
    severeDisabled: 3,
  });
  const [bluwear, setBluwear] = useState<BluwearInput>({
    totalRevenue: 300000000,
    contractAmount: 30000000,
    disabledWorkers: 10,
    severeDisabledWorkers: 5,
  });
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  useEffect(() => {
    const newCompany = { ...company, type: companyType };
    setCompany(newCompany);
    const calc = calculateReduction(newCompany, bluwear);
    setResult(calc);
  }, [companyType, company.totalEmployees, company.disabledEmployees, company.severeDisabled, 
      bluwear.totalRevenue, bluwear.contractAmount, bluwear.disabledWorkers, bluwear.severeDisabledWorkers]);

  const handleCompanyChange = (field: keyof CompanyInput, value: number) => {
    setCompany(prev => ({ ...prev, [field]: value }));
  };

  const handleBluwearChange = (field: keyof BluwearInput, value: number) => {
    setBluwear(prev => ({ ...prev, [field]: value }));
  };

  const companyTypes = [
    { id: 'private', label: '민간기업', desc: '의무고용률 3.1%' },
    { id: 'public', label: '공공기관', desc: '의무고용률 3.8%' },
    { id: 'government', label: '국가/지자체', desc: '의무고용률 3.8%' },
  ];

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
            <div className="text-right text-sm text-gray-500">
              <p>2025년 부담기초액</p>
              <p className="font-semibold text-blue-600">{formatKRW(LEVY_BASE_2025)}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Type Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            사업장 유형 선택
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {companyTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setCompanyType(type.id as 'private' | 'public' | 'government')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  companyType === type.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="text-left">
                  <p className={`font-semibold ${companyType === type.id ? 'text-blue-600' : 'text-gray-900'}`}>
                    {type.label}
                  </p>
                  <p className="text-sm text-gray-500">{type.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Company Info */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                귀사 현황
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상시근로자 수
                  </label>
                  <input
                    type="number"
                    value={company.totalEmployees}
                    onChange={(e) => handleCompanyChange('totalEmployees', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    의무고용인원: {Math.floor(company.totalEmployees * (companyType === 'private' ? MANDATORY_RATE.private : MANDATORY_RATE.public))}명
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      현재 장애인 고용
                    </label>
                    <input
                      type="number"
                      value={company.disabledEmployees}
                      onChange={(e) => handleCompanyChange('disabledEmployees', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      중증장애인 수
                    </label>
                    <input
                      type="number"
                      value={company.severeDisabled}
                      onChange={(e) => handleCompanyChange('severeDisabled', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">중증은 2배수 인정</p>
                  </div>
                </div>
              </div>
            </div>

            {/* BLUWEAR Info */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                BLUWEAR 연계고용 정보
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-100 mb-1">
                      BLUWEAR 연간 총매출
                    </label>
                    <input
                      type="number"
                      value={bluwear.totalRevenue}
                      onChange={(e) => handleBluwearChange('totalRevenue', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:ring-2 focus:ring-white/50 text-white placeholder-white/50"
                    />
                    <p className="text-xs text-blue-200 mt-1">{formatBillion(bluwear.totalRevenue)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-100 mb-1">
                      귀사 도급 계약금
                    </label>
                    <input
                      type="number"
                      value={bluwear.contractAmount}
                      onChange={(e) => handleBluwearChange('contractAmount', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:ring-2 focus:ring-white/50 text-white placeholder-white/50"
                    />
                    <p className="text-xs text-blue-200 mt-1">{formatBillion(bluwear.contractAmount)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-100 mb-1">
                      BLUWEAR 장애인 근로자
                    </label>
                    <input
                      type="number"
                      value={bluwear.disabledWorkers}
                      onChange={(e) => handleBluwearChange('disabledWorkers', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:ring-2 focus:ring-white/50 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-100 mb-1">
                      중증장애인 수
                    </label>
                    <input
                      type="number"
                      value={bluwear.severeDisabledWorkers}
                      onChange={(e) => handleBluwearChange('severeDisabledWorkers', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:ring-2 focus:ring-white/50 text-white"
                    />
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white/10 rounded-xl">
                  <p className="text-sm text-blue-100">
                    수급액 비율: <span className="font-bold text-white">{result ? (result.supplyRatio * 100).toFixed(2) : 0}%</span>
                    <span className="text-blue-200 ml-2">(도급금 ÷ 총매출)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="space-y-6">
            {result && (
              <>
                {/* Summary Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5" />
                      감면 효과 요약
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-emerald-100 text-sm">현재 부담금</p>
                        <p className="text-2xl font-bold">{formatBillion(result.annualLevy)}</p>
                      </div>
                      <div>
                        <p className="text-emerald-100 text-sm">최종 감면액</p>
                        <p className="text-2xl font-bold text-yellow-300">-{formatBillion(result.finalReduction)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-600">감면 후 부담금</span>
                      <span className="text-2xl font-bold text-gray-900">{formatBillion(result.netLevy)}</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                        style={{ width: `${Math.min(result.savingsPercent, 100)}%` }}
                      />
                    </div>
                    <p className="text-center text-lg font-bold text-emerald-600 mt-2">
                      {result.savingsPercent.toFixed(1)}% 절감!
                    </p>
                  </div>
                </div>

                {/* Detail Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    상세 계산 내역
                  </h3>
                  
                  <div className="space-y-4">
                    {/* 현황 */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h4 className="font-medium text-gray-700 mb-2">📊 귀사 현황</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-gray-500">의무고용인원</span>
                        <span className="text-right font-medium">{result.mandatoryEmployees}명</span>
                        <span className="text-gray-500">미달인원</span>
                        <span className="text-right font-medium text-red-600">{result.shortfall}명</span>
                        <span className="text-gray-500">고용수준</span>
                        <span className="text-right font-medium">{getEmploymentLevelLabel(result.employmentLevel)}</span>
                        <span className="text-gray-500">적용 부담기초액</span>
                        <span className="text-right font-medium">{formatKRW(result.levyBase)}</span>
                      </div>
                    </div>

                    {/* 부담금 */}
                    <div className="p-4 bg-red-50 rounded-xl">
                      <h4 className="font-medium text-red-700 mb-2">💸 현재 연간 부담금</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        {result.shortfall}명 × {formatKRW(result.levyBase)} × 12개월
                      </p>
                      <p className="text-xl font-bold text-red-600">{formatKRW(result.annualLevy)}</p>
                    </div>

                    {/* 감면 계산 */}
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <h4 className="font-medium text-blue-700 mb-2">🧮 감면액 계산</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-gray-500">BLUWEAR 장애인(2배수)</span>
                        <span className="text-right font-medium">{result.doubleCountWorkers}명</span>
                        <span className="text-gray-500">수급액비율</span>
                        <span className="text-right font-medium">{(result.supplyRatio * 100).toFixed(2)}%</span>
                        <span className="text-gray-500">월별 감면액</span>
                        <span className="text-right font-medium">{formatKRW(result.monthlyReduction)}</span>
                        <span className="text-gray-500">연간 감면계산액</span>
                        <span className="text-right font-medium">{formatKRW(result.annualReduction)}</span>
                      </div>
                    </div>

                    {/* 한도 */}
                    <div className="p-4 bg-amber-50 rounded-xl">
                      <h4 className="font-medium text-amber-700 mb-2">⚠️ 감면 한도</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">부담금의 90%</span>
                          <span className={`font-medium ${result.finalReduction === result.limit90Percent ? 'text-amber-600' : 'text-gray-500'}`}>
                            {formatKRW(result.limit90Percent)}
                            {result.finalReduction === result.limit90Percent && ' ← 적용'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">도급액의 50%</span>
                          <span className={`font-medium ${result.finalReduction === result.limit50Percent ? 'text-amber-600' : 'text-gray-500'}`}>
                            {formatKRW(result.limit50Percent)}
                            {result.finalReduction === result.limit50Percent && ' ← 적용'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 최종 */}
                    <div className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                      <h4 className="font-medium text-emerald-700 mb-2">✅ 최종 감면액</h4>
                      <p className="text-2xl font-bold text-emerald-600">{formatKRW(result.finalReduction)}</p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                  <h3 className="font-semibold text-lg mb-2">BLUWEAR와 함께하세요!</h3>
                  <p className="text-blue-100 text-sm mb-4">
                    장애인고용부담금 감면과 ESG 경영 실현을 동시에!
                  </p>
                  <button className="w-full py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                    상담 신청하기
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg shadow-gray-100 border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">연계고용 제도란?</h3>
            <p className="text-sm text-gray-600">
              장애인표준사업장과 거래 시, 해당 사업장의 장애인 근로자를
              귀사가 고용한 것으로 간주하여 부담금을 감면받는 제도입니다.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg shadow-gray-100 border border-gray-100">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
              <TrendingDown className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">감면 한도</h3>
            <p className="text-sm text-gray-600">
              연간 부담금의 90% 이내, 도급금액의 50% 이내로 감면됩니다.
              두 한도 중 낮은 금액이 최종 감면액으로 적용됩니다.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg shadow-gray-100 border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">중증장애인 2배수</h3>
            <p className="text-sm text-gray-600">
              중증장애인은 2명으로 산정됩니다. BLUWEAR는 중증장애인 고용에
              특화되어 더 높은 감면 효과를 제공합니다.
            </p>
          </div>
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
