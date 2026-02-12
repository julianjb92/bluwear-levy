// 장애인고용부담금 연계고용 감면 계산기

// 2025년 부담기초액
export const LEVY_BASE_2025 = 1258000;

// 의무고용률 (2024-2025)
export const MANDATORY_RATE = {
  private: 0.031,    // 민간사업주 3.1%
  public: 0.038,     // 국가/지자체/교육청 3.8%
};

// 부담금 가산율 (고용수준별)
export const LEVY_RATE = {
  above75: { rate: 0, base: 1258000 },      // 3/4 이상 고용
  above50: { rate: 0.06, base: 1333480 },   // 1/2~3/4 미달
  above25: { rate: 0.20, base: 1509600 },   // 1/4~1/2 미달
  below25: { rate: 0.40, base: 1761200 },   // 1/4 미달
  zero: { base: 2096270 },                   // 0명 고용 (최저임금 기준)
};

// 감면 한도
export const REDUCTION_LIMITS = {
  levyPercent: 0.9,   // 부담금의 90%
  contractPercent: 0.5, // 도급금액의 50%
};

export interface CompanyInput {
  type: 'private' | 'public' | 'government';  // 민간/공공기관 vs 국가/지자체
  totalEmployees: number;           // 상시근로자 수
  disabledEmployees: number;        // 장애인 고용 수
  severeDisabled: number;           // 중증장애인 수
}

export interface BluwearInput {
  totalRevenue: number;             // BLUWEAR 연간 총매출
  contractAmount: number;           // 도급 계약 금액
  disabledWorkers: number;          // BLUWEAR 장애인 근로자 수
  severeDisabledWorkers: number;    // BLUWEAR 중증장애인 수
}

export interface GovernmentExtra {
  prevYearDisabledRate: number;     // 전년도 12월 장애인고용률
  currentYearDisabledRate: number;  // 해당연도 12월 장애인고용률
  purchaseTarget: number;           // 우선구매목표
  purchaseActual: number;           // 우선구매실적
}

export interface CalculationResult {
  // 기본 정보
  mandatoryEmployees: number;       // 의무고용인원
  shortfall: number;                // 미달인원
  employmentLevel: string;          // 고용수준
  
  // 현재 부담금
  levyBase: number;                 // 적용 부담기초액
  annualLevy: number;               // 연간 부담금액
  
  // 감면 계산
  doubleCountWorkers: number;       // 2배수 적용 장애인수
  supplyRatio: number;              // 수급액 비율
  monthlyReduction: number;         // 월별 감면액
  annualReduction: number;          // 연간 감면 계산액
  
  // 최종 감면
  limit90Percent: number;           // 부담금 90% 한도
  limit50Percent: number;           // 도급액 50% 한도
  finalReduction: number;           // 최종 감면액
  
  // 효과
  netLevy: number;                  // 감면 후 부담금
  savingsPercent: number;           // 절감률
}

// 의무고용인원 계산
export function calculateMandatoryEmployees(employees: number, type: 'private' | 'public' | 'government'): number {
  const rate = type === 'private' ? MANDATORY_RATE.private : MANDATORY_RATE.public;
  return Math.floor(employees * rate);
}

// 고용수준 판단
export function getEmploymentLevel(mandatory: number, actual: number): {
  level: string;
  levyBase: number;
} {
  if (actual === 0) {
    return { level: 'zero', levyBase: LEVY_RATE.zero.base };
  }
  
  const ratio = actual / mandatory;
  
  if (ratio >= 0.75) {
    return { level: 'above75', levyBase: LEVY_RATE.above75.base };
  } else if (ratio >= 0.5) {
    return { level: 'above50', levyBase: LEVY_RATE.above50.base };
  } else if (ratio >= 0.25) {
    return { level: 'above25', levyBase: LEVY_RATE.above25.base };
  } else {
    return { level: 'below25', levyBase: LEVY_RATE.below25.base };
  }
}

// 2배수 적용 장애인수 계산
export function calculateDoubleCount(total: number, severe: number): number {
  return severe * 2 + (total - severe);
}

// 수급액 비율 계산 (소수점 4자리까지)
export function calculateSupplyRatio(contractAmount: number, totalRevenue: number): number {
  return Math.floor((contractAmount / totalRevenue) * 10000) / 10000;
}

// 월별 감면액 계산
export function calculateMonthlyReduction(
  doubleCount: number,
  supplyRatio: number,
  levyBase: number = LEVY_BASE_2025
): number {
  return Math.floor((doubleCount * supplyRatio * levyBase) / 10) * 10;
}

// 전체 감면 계산
export function calculateReduction(
  company: CompanyInput,
  bluwear: BluwearInput,
  governmentExtra?: GovernmentExtra
): CalculationResult {
  // 의무고용인원
  const mandatoryEmployees = calculateMandatoryEmployees(company.totalEmployees, company.type);
  
  // 2배수 적용 실제 고용
  const actualDoubleCount = calculateDoubleCount(company.disabledEmployees, company.severeDisabled);
  
  // 미달인원
  const shortfall = Math.max(0, mandatoryEmployees - actualDoubleCount);
  
  // 고용수준 판단
  const { level, levyBase } = getEmploymentLevel(mandatoryEmployees, actualDoubleCount);
  
  // 연간 부담금액
  const annualLevy = shortfall * levyBase * 12;
  
  // BLUWEAR 장애인 2배수 적용
  const doubleCountWorkers = calculateDoubleCount(bluwear.disabledWorkers, bluwear.severeDisabledWorkers);
  
  // 수급액 비율
  const supplyRatio = calculateSupplyRatio(bluwear.contractAmount, bluwear.totalRevenue);
  
  // 월별 감면액
  const monthlyReduction = calculateMonthlyReduction(doubleCountWorkers, supplyRatio, LEVY_BASE_2025);
  
  // 연간 감면 계산액
  const annualReduction = monthlyReduction * 12;
  
  // 감면 한도 계산
  const limit90Percent = annualLevy * REDUCTION_LIMITS.levyPercent;
  const limit50Percent = bluwear.contractAmount * REDUCTION_LIMITS.contractPercent;
  
  // 국가/지자체인 경우 추가 요건 체크
  let effectiveAnnualReduction = annualReduction;
  if (company.type === 'government' && governmentExtra) {
    // 우선구매 초과액 반영
    const purchaseExcess = Math.max(0, governmentExtra.purchaseActual - governmentExtra.purchaseTarget);
    const effectiveContract = Math.min(bluwear.contractAmount, purchaseExcess);
    const adjustedSupplyRatio = calculateSupplyRatio(effectiveContract, bluwear.totalRevenue);
    const adjustedMonthly = calculateMonthlyReduction(doubleCountWorkers, adjustedSupplyRatio, LEVY_BASE_2025);
    effectiveAnnualReduction = adjustedMonthly * 12;
  }
  
  // 최종 감면액 (한도 적용)
  const finalReduction = Math.min(effectiveAnnualReduction, limit90Percent, limit50Percent);
  
  // 감면 후 부담금
  const netLevy = annualLevy - finalReduction;
  
  // 절감률
  const savingsPercent = annualLevy > 0 ? (finalReduction / annualLevy) * 100 : 0;
  
  return {
    mandatoryEmployees,
    shortfall,
    employmentLevel: level,
    levyBase,
    annualLevy,
    doubleCountWorkers,
    supplyRatio,
    monthlyReduction,
    annualReduction: effectiveAnnualReduction,
    limit90Percent,
    limit50Percent,
    finalReduction,
    netLevy,
    savingsPercent,
  };
}

// 고용수준 레이블
export function getEmploymentLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    above75: '3/4 이상 고용',
    above50: '1/2~3/4 미달 (6% 가산)',
    above25: '1/4~1/2 미달 (20% 가산)',
    below25: '1/4 미달 (40% 가산)',
    zero: '0명 고용 (최저임금 기준)',
  };
  return labels[level] || level;
}

// 금액 포맷
export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(amount)) + '원';
}

// 억 단위 포맷
export function formatBillion(amount: number): string {
  const billion = amount / 100000000;
  if (billion >= 1) {
    return `${billion.toFixed(1)}억원`;
  }
  const man = amount / 10000;
  return `${new Intl.NumberFormat('ko-KR').format(Math.round(man))}만원`;
}
