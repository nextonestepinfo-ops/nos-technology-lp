// analytics.js : プロバイダ非依存の軽量計測フック
// config.ANALYTICS_ID が未設定なら何もしない（no-op）。
import { config } from "./config.js";

// イベント送出。gtag等が読み込まれていれば渡し、無ければコンソールにも出さない。
export function trackEvent(name, params = {}) {
  if (!config.ANALYTICS_ID) return; // 計測未設定時は完全に無効

  try {
    // GA4 (gtag) が存在する場合
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params);
      return;
    }
    // dataLayer (GTM) が存在する場合
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: name, ...params });
    }
  } catch (e) {
    // 計測失敗は本体の動作に影響させない
  }
}
