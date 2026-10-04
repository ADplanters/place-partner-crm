import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { keyword, placeUrl } = await req.json();

    // 1. 단축 URL(naver.me)인 경우 원래 주소로 접속해서 진짜 URL 찾기
    let finalUrl = placeUrl;
    if (placeUrl.includes("naver.me")) {
      try {
        const res = await fetch(placeUrl, { redirect: "follow" });
        finalUrl = res.url;
      } catch (e) {
        console.error("URL 리다이렉트 실패");
      }
    }

    // 2. 플레이스 고유 ID(숫자) 정확히 추출
    const idMatch = finalUrl.match(/(?:place|restaurant|hairshop|accommodation)\/(\d+)/) || finalUrl.match(/\/(\d{6,15})/);
    const placeId = idMatch ? idMatch[1] : null;

    if (!placeId) {
      return NextResponse.json({ rank: 0, page: 0, message: "플레이스 ID 추출 실패" });
    }

    // 3. 네이버 검색 결과 최대 6페이지(약 300개 업체)까지 싹 뒤져서 순위 찾기
    let exactRank = 0;
    let exactPage = 0;
    let found = false;

    // 최대 6페이지(300위)까지 탐색
    for (let page = 1; page <= 6; page++) {
      const searchApiUrl = `https://map.naver.com/v5/api/search?caller=pc_map&query=${encodeURIComponent(keyword)}&page=${page}&displayCount=50&isPlaceRecommendationReplace=true&lang=ko`;

      const searchRes = await fetch(searchApiUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const searchData = await searchRes.json();
      const places = searchData?.result?.place?.list || [];
      
      // 검색 결과가 더 이상 없으면 중단
      if (places.length === 0) break;

      // 해당 페이지 안에서 우리 매장 ID 찾기
      const index = places.findIndex((p: any) => p.id === placeId);

      if (index !== -1) {
        // 찾았을 경우 정확한 순위 계산 (이전 페이지 개수 + 현재 페이지 순서)
        exactRank = (page - 1) * 50 + index + 1;
        exactPage = Math.ceil(exactRank / 20); // 모바일 기준 대략 20개당 1페이지로 환산
        found = true;
        break; 
      }
    }

    if (found) {
      return NextResponse.json({ rank: exactRank, page: exactPage, message: "순위 확인 완료" });
    } else {
      // 300개 업체(끝까지) 뒤져도 없으면 완전한 '순위권 밖'
      return NextResponse.json({ rank: 0, page: 0, message: "순위권 밖" });
    }

  } catch (error) {
    console.error("순위 조회 에러:", error);
    return NextResponse.json({ rank: 0, page: 0, message: "서버 에러" }, { status: 500 });
  }
}