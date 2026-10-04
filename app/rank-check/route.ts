// app/api/check-rank/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { keyword, placeUrl } = await req.json();

    // 1. 단축 URL(naver.me)인 경우 원래 주소로 리다이렉트하여 고유 ID 추출
    let finalUrl = placeUrl;
    if (placeUrl.includes("naver.me")) {
      const res = await fetch(placeUrl, { redirect: "follow" });
      finalUrl = res.url;
    }

    // URL에서 네이버 플레이스 고유 ID(숫자) 추출
    const idMatch = finalUrl.match(/(?:restaurant|place|hairshop)\/(\d+)/);
    const placeId = idMatch ? idMatch[1] : null;

    if (!placeId) {
      return NextResponse.json({ rank: 0, page: 0, message: "플레이스 ID를 찾을 수 없습니다." });
    }

    // 2. 네이버 지도 API를 호출하여 키워드 검색 결과 최대 60개(약 3페이지 분량) 스캔
    const searchApiUrl = `https://map.naver.com/v5/api/search?caller=pc_map&query=${encodeURIComponent(
      keyword
    )}&displayCount=60&isPlaceRecommendationReplace=true&lang=ko`;

    const searchRes = await fetch(searchApiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json, text/plain, */*",
      },
      cache: "no-store", // 항상 최신 결과 실시간 조회
    });

    const searchData = await searchRes.json();
    const places = searchData?.result?.place?.list || [];

    // 3. 내 매장 아이디가 몇 번째에 있는지 찾기
    const index = places.findIndex((p: any) => p.id === placeId);

    if (index !== -1) {
      const actualRank = index + 1;
      // 한 페이지당 대략 20개~30개씩 노출되는 것을 기준으로 페이지 계산 (모바일 기준 20개)
      const actualPage = Math.ceil(actualRank / 20); 
      
      return NextResponse.json({ rank: actualRank, page: actualPage, message: "조회 성공" });
    } else {
      // 60위 밖이면 순위권 밖으로 처리
      return NextResponse.json({ rank: 0, page: 0, message: "60위 밖 (3페이지 이하)" });
    }
  } catch (error) {
    console.error("순위 조회 에러:", error);
    return NextResponse.json({ rank: 0, page: 0, message: "조회 오류" }, { status: 500 });
  }
}