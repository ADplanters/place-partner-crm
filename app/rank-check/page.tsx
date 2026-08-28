"use client";

import React, { useState } from "react";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Search, MapPin, Phone, User, CheckCircle2, AlertCircle } from "lucide-react";

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 연락처 유효성 검사 (010 시작, 11자리, 단순/연속 번호 방지)
  const validatePhone = (phone: string) => {
    const numbersOnly = phone.replace(/[^0-9]/g, "");

    if (!numbersOnly.startsWith("010")) {
      return "연락처는 010으로 시작해야 합니다.";
    }

    if (numbersOnly.length !== 11) {
      return "올바른 연락처 길이를 입력해주세요. (11자리)";
    }

    // 대표적인 허위/장난 번호 패턴
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

    // 중간 4자리 또는 끝 4자리가 모두 같은 숫자 반복 방지 (예: 010-2222-3333)
    const middle = numbersOnly.substring(3, 7);
    const end = numbersOnly.substring(7, 11);
    if (/^(\d)\1+$/.test(middle) && /^(\d)\1+$/.test(end)) {
      return "정확한 연락처를 입력해주세요.";
    }

    return "";
  };

  // 폼 입력 처리 (010 하이픈 자동 포맷팅)
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

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "leads"), {
        name: formData.name,
        phone: formData.phone.replace(/-/g, ""),
        placeUrl: formData.placeUrl,
        keyword: formData.keyword,
        status: "신규 접수",
        createdAt: serverTimestamp(),
      });

      setIsSuccess(true);
    } catch (error) {
      console.error("데이터 저장 실패:", error);
      alert("접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">진단 신청이 완료되었습니다!</h2>
          <p className="text-gray-600 font-medium text-sm leading-relaxed mb-6">
            입력해주신 연락처로 10분 내에<br />
            상세 분석 리포트를 보내드리겠습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-4 flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <div className="inline-block px-3 py-1 bg-red-100 text-red-600 font-bold text-xs rounded-full mb-3">
          * PLACE PARTNER 독점 제공
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">
          내 매장 플레이스 <span className="text-blue-600">순위 진단</span>
        </h1>
        <p className="text-gray-500 font-medium text-xs md:text-sm leading-relaxed">
          미슐랭 가이드 데이터 알고리즘을 기반으로<br />
          사장님 매장의 현재 위치와 문제점을 1분 만에 진단해 드립니다.
        </p>
      </div>

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 text-white text-center py-4 text-xs font-bold tracking-wide">
          무료 진단 리포트 신청 Form
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
              연락처 <span className="text-gray-400 font-normal">(결과 수신용)</span>
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
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl text-white font-black text-xs shadow-lg transition-all ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5"
            }`}
          >
            {isSubmitting ? "진단 중입니다..." : "무료 순위 진단받기"}
          </button>
        </form>
      </div>

      <div className="mt-6 text-center text-xs font-medium text-gray-400">
        입력하신 정보는 진단 리포트 발송 목적으로만 사용되며 안전하게 처리됩니다.
      </div>
    </div>
  );
}