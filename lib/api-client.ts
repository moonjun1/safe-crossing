const BASE_URL = "https://apis.data.go.kr/B551982/rti";

export interface CrossingInfo {
  crsrdId: string;
  crsrdNm: string;
  mapCtptIntLat: string;
  mapCtptIntLot: string;
  laneWdth: string;
  lmtSpd: string;
  stdgCd?: string;
}

export interface SignalInfo {
  crsrdId: string;
  [key: string]: string | number | undefined;
}

function getApiKey(): string {
  const key = process.env.DATA_GO_KR_API_KEY;
  if (!key) throw new Error("DATA_GO_KR_API_KEY is not set");
  return key;
}

export async function fetchCrossings(
  stdgCd: string,
  numOfRows = 50,
  pageNo = 1
): Promise<CrossingInfo[]> {
  const url = `${BASE_URL}/crsrd_map_info?serviceKey=${getApiKey()}&type=json&numOfRows=${numOfRows}&pageNo=${pageNo}&stdgCd=${stdgCd}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  const items = data?.body?.items?.item;
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

export async function fetchSignalInfo(
  crsrdId: string
): Promise<SignalInfo | null> {
  const url = `${BASE_URL}/tl_drct_info?serviceKey=${getApiKey()}&type=json&numOfRows=10&pageNo=1&crsrdId=${crsrdId}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;

    const data = await res.json();
    const items = data?.body?.items?.item;
    if (!items) return null;
    const item = Array.isArray(items) ? items[0] : items;
    return item;
  } catch {
    return null;
  }
}

/**
 * 신호 정보에서 보행자 신호 잔여 시간(초)을 추출.
 * tl_drct_info 응답 필드가 불확실하므로 여러 후보를 순회.
 */
export function extractPedestrianSignalSeconds(
  signal: SignalInfo | null
): number | null {
  if (!signal) return null;

  // 가능한 보행신호 관련 필드명 후보
  const candidateFields = [
    "pdsgRmdrCs",       // pedestrian remaining seconds
    "pdsgGrnRmdrCs",    // pedestrian green remaining
    "pdSignRmdrCs",
    "ntPdsgRmdrCs",     // north pedestrian
    "stPdsgRmdrCs",     // south pedestrian
    "etPdsgRmdrCs",     // east pedestrian
    "wtPdsgRmdrCs",     // west pedestrian
    "greenRemainTime",
    "pdGreenRmdrCs",
  ];

  for (const field of candidateFields) {
    const val = signal[field];
    if (val !== undefined && val !== null && val !== "") {
      const num = typeof val === "number" ? val : Number(val);
      if (!isNaN(num) && num > 0) return num;
    }
  }

  // 방향별 보행신호 필드에서 최대값 추출 시도
  const dirPrefixes = ["nt", "st", "et", "wt", "ne", "nw", "se", "sw"];
  const suffixes = ["PdsgRmdrCs", "PdGrnRmdrCs", "PdsgGreenRmdrCs"];

  let maxSeconds = 0;
  for (const prefix of dirPrefixes) {
    for (const suffix of suffixes) {
      const key = prefix + suffix;
      const val = signal[key];
      if (val !== undefined && val !== null && val !== "") {
        const num = typeof val === "number" ? val : Number(val);
        if (!isNaN(num) && num > maxSeconds) {
          maxSeconds = num;
        }
      }
    }
  }

  return maxSeconds > 0 ? maxSeconds : null;
}

// 지역 코드 매핑
export const REGION_CODES: Record<string, string> = {
  서울: "11",
  부산: "26",
  대구: "27",
  인천: "28",
  광주: "29",
  대전: "30",
  울산: "31",
  세종: "36",
  경기: "41",
  강원: "42",
  충북: "43",
  충남: "44",
  전북: "45",
  전남: "46",
  경북: "47",
  경남: "48",
  제주: "50",
};
