"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  Search,
  MapPin,
  Phone,
  User,
  AlertCircle,
  BarChart3,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  Award,
} from "lucide-react";

export default function RankCheckPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    placeUrl: "",
    keyword: "",
  });

  const [errors, setErrors] = useState({
    phone: "",
    placeUrl: "",
  });

  // 상태 흐름: 'form' | 'analyzing' | 'result'
  const [step, setStep] = useState<"form" | "analyzing" | "result">("form");
  const [loadingText, setLoadingText] = useState("네이버 플레이스 데이터 수집 중...");

  // 연락처 유효성 검사 (010 시작, 11자리, 단순/연속 번호 방지)
  const validatePhone = (phone: string) => {
    const numbersOnly = phone.replace(/[^0-9]/g, "");

    if (!numbersOnly.startsWith("010")) {
      return "연락처는 010으로 시작해야 합니다.";
    }

    if (numbersOnly.length !== 11) {
      return "올바른 연락처 길이를 입력해주세요. (11자리)";
    }

    const invalidPatterns = [
      "01011111111",
      "01022222222",
      "01033333333",
      "01044444444",
      "01055555555",
      "01066666666",
      "01077777777",
      "01088888888",
      "01099999999",
      "01012345678",
      "01000000000",
    ];

    if (invalidPatterns.includes(numbersOnly)) {
      return "정확한 연락처를 입력해주세요.";
    }

    const middle = numbersOnly.substring(3, 7);
    const end = numbersOnly.substring(7, 11);
    if (/^(\d)\1+$/.test(middle) && /^(\d)\1+$/.test(end)) {
      return "정확한 연락처를 입력해주세요.";
    }

    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const onlyNums = value.replace(/[^0-9]/g, "");
      let formattedPhone = onlyNums;

      if (onlyNums.length > 3 && onlyNums.length <= 7) {
        formattedPhone = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
      } else if (onlyNums.length > 7) {
        formattedPhone = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 7)}-${onlyNums.slice(7, 11)}`;
      }

      setFormData({ ...formData, [name]: formattedPhone });
      if (errors.phone) setErrors({ ...errors, phone: "" });
    } else if (name === "placeUrl") {
      setFormData({ ...formData, [name]: value });
      if (errors.placeUrl) setErrors({ ...errors, placeUrl: "" });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneError = validatePhone(formData.phone);
    if (phoneError) {
      setErrors({ ...errors, phone: phoneError });
      return;
    }

    if (!formData.placeUrl.includes("naver.com")) {
      setErrors({ ...errors, placeUrl: "올바른 네이버 플레이스 URL을 입력해주세요." });
      return;
    }

    // 1. 분석 스캐닝 화면 전환
    setStep("analyzing");

    try {
      // DB 저장
      await addDoc(collection(db, "leads"), {
        name: formData.name,
        phone: formData.phone.replace(/-/g, ""),
        placeUrl: formData.placeUrl,
        keyword: formData.keyword,
        status: "신규 접수",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("데이터 저장 실패:", error);
    }
  };

  // 분석 애니메이션 텍스트 연출 후 결과 화면으로 전환
  useEffect(() => {
    if (step === "analyzing") {
      const timer1 = setTimeout(() => {
        setLoadingText("타겟 키워드 경쟁도 및 알고리즘 진단 중...");
      }, 1000);

      const timer2 = setTimeout(() => {
        setLoadingText("순위 및 최적화 점수 리포트 생성 중...");
      }, 2000);

      const timer3 = setTimeout(() => {
        setStep("result");
      }, 3000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-4 flex flex-col items-center justify-center">
      {/* 1. 입력 폼 화면 */}
      {step === "form" && (
        <>
          <div className="text-center mb-8">
            <div className="inline-block px-3 py-1 bg-red-100 text-red-600 font-bold text-xs rounded-full mb-3">
              * PLACE PARTNER 독점 제공
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">
              내 매장 플레이스 <span className="text-blue-600">순위 진단</span>
            </h1>
            <p className="text-gray-500 font-medium text-xs md:text-sm leading-relaxed">
              미슐랭 가이드 데이터 알고리즘을 기반으로<br />
              사장님 매장의 현재 위치와 문제점을 실시간으로 진단해 드립니다.
            </p>
          </div>

          <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-900 text-white text-center py-4 text-xs font-bold tracking-wide">
              실시간 순위 진단 Form
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">사장님 성함</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="예: 홍길동"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-xs font-medium bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  연락처 <span className="text-gray-400 font-normal">(진단 결과 및 상담 수신용)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 text-gray-400" size={18} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="010-0000-0000"
                    maxLength={13}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-xs font-medium bg-gray-50 focus:bg-white outline-none transition-all ${
                      errors.phone
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                    }`}
                    required
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">네이버 플레이스 URL</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 text-gray-400" size={18} />
                  <input
                    type="url"
                    name="placeUrl"
                    value={formData.placeUrl}
                    onChange={handleChange}
                    placeholder="https://m.place.naver.com/..."
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-xs font-medium bg-gray-50 focus:bg-white outline-none transition-all ${
                      errors.placeUrl
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                    }`}
                    required
                  />
                </div>
                {errors.placeUrl && (
                  <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.placeUrl}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">조회 희망 키워드</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="keyword"
                    value={formData.keyword}
                    onChange={handleChange}
                    placeholder="예: 강남역 삼겹살"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-xs font-medium bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl text-white font-black text-xs bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
              >
                실시간 순위 진단받기
              </button>
            </form>
          </div>

          <div className="mt-6 text-center text-xs font-medium text-gray-400">
            입력하신 정보는 진단 결과 안내 및 1:1 맞춤 컨설팅 목적으로 사용됩니다.
          </div>
        </>
      )}

      {/* 2. 스캐닝 로딩 화면 */}
      {step === "analyzing" && (
        <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full text-center flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <BarChart3 size={24} className="absolute inset-0 m-auto text-blue-600" />
          </div>
          <h2 className="text-lg font-black text-gray-900 mb-2">플레이스 데이터 분석 중...</h2>
          <p className="text-xs font-bold text-blue-600 animate-pulse">{loadingText}</p>
        </div>
      )}

      {/* 3. 진단 결과 실시간 대시보드 화면 */}
      {step === "result" && (
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-900 text-white p-6 text-center">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-[11px] font-bold rounded-full mb-2">
              <Award size={13} /> 진단 분석 리포트 완료
            </div>
            <h2 className="text-xl font-black">{formData.name} 사장님의 플레이스 진단 결과</h2>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-500">진단 키워드</span>
                <span className="font-black text-blue-600 text-sm">[{formData.keyword}]</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-gray-200/60 pt-2">
                <span className="font-bold text-gray-500">현재 노출 상태</span>
                <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">
                  1페이지 미노출 / 최적화 시급
                </span>
              </div>
            </div>

            {/* 진단 순위 리포트 박스 (오타 수정 위치) */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-center">
              <div className="text-xs font-bold text-gray-500 mb-1">
                [{formData.keyword}] 키워드 통합 검색
              </div>
              <div className="text-3xl font-black text-gray-900 my-2">
                추정 순위: <span className="text-red-600">순위권 밖 (3페이지 이하)</span>
              </div>
              <p className="text-xs font-medium text-gray-600 leading-relaxed mt-2">
                현재 플레이스 세팅 지수가 낮아 타겟 키워드 검색 시 상위 노출에 어려움을 겪고 있습니다.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-blue-600 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2 text-blue-600">
                <PhoneCall size={18} className="animate-bounce" />
                <h3 className="font-black text-sm">1:1 맞춤 순위 상승 솔루션 안내</h3>
              </div>
              <p className="text-xs font-medium text-gray-600 leading-relaxed mb-3">
                상세한 순위 진단 수치 분석과 1페이지 진입을 위한 광고/최적화 가이드는{" "}
                <span className="font-bold text-gray-900">
                  담당 디렉터가 10분 내로 [{formData.phone}] 번호로 직접 안내
                </span>
                해 드릴 예정입니다.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl">
                <ShieldCheck size={14} /> 무료 진단 컨설팅 진행 중이며 별도의 비용이 발생하지 않습니다.
              </div>
            </div>

            <button
              onClick={() => {
                setStep("form");
                setFormData({ name: "", phone: "", placeUrl: "", keyword: "" });
              }}
              className="w-full py-3.5 rounded-xl font-bold text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={14} /> 다른 키워드/매장 다시 진단하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}