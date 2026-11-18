// ============================================================
//  دستیار هوشمند فروشگاهی (Cloudflare Workers AI)
//  فقط وقتی فعال است که ادمین از پنل وب آن را روشن کند.
// ============================================================
import {
  getSetting,
  getProducts,
  getGameCatalog,
  getProductCatalogMeta,
  getOtherDollarDeals,
} from './db.js';

// Model ID supported by the current Workers AI catalog.
const AI_MODEL = '@cf/google/gemma-4-26b-a4b-it';
const TRUST_LINKS = ['https://t.me/trust_phoenixx', 'https://t.me/lock_phoenix'];
const UNAVAILABLE_REPLY = '🤖 در حال حاضر دستیار هوشمند در دسترس نیست. لطفاً از بخش 🎧 پشتیبانی پیام بگذارید.';

function extractAnswer(result) {
  const answer = typeof result?.response === 'string'
    ? result.response
    : result?.choices?.[0]?.message?.content;
  return typeof answer === 'string' ? answer.trim() : '';
}

function moneyInToman(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'قیمت تومان هنوز در پنل ثبت نشده';
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
}

function productDisplayName(productName, gameName, separator) {
  const name = String(productName || '');
  const game = String(gameName || '').trim();
  return game && !name.toLocaleLowerCase('fa-IR').includes(game.toLocaleLowerCase('fa-IR'))
    ? game + separator + name
    : name;
}

function isTrustQuestion(text) {
  return /(اعتماد|معتبر|اطمینان|مطمئن|کلاهبردار|اسکم|ضمانت|نماد اعتماد|قابل اعتماد)/i.test(String(text || ''));
}

function isPriceQuestion(text) {
  return /(قیمت|چند|تومان|هزینه|price|how much|cost)/i.test(String(text || ''));
}

function searchTokens(value) {
  return String(value || '').toLocaleLowerCase('fa-IR')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .trim().split(/\s+/).filter(Boolean);
}

function relevantProductsForPrice(question, products, games, meta) {
  if (!products.length) return [];
  const query = searchTokens(question);
  const queryText = ' ' + query.join(' ') + ' ';
  const normalizedNames = products.map((product) => ({
    product,
    tokens: searchTokens(product.name),
    normalized: searchTokens(product.name).join(' '),
  }));
  const exact = normalizedNames.filter((entry) => entry.normalized && queryText.includes(' ' + entry.normalized + ' '));
  if (exact.length) return exact.map((entry) => entry.product);

  const querySet = new Set(query);
  const matchedGames = games.filter((game) => searchTokens(game.name).some((token) => token.length >= 3 && querySet.has(token)));
  if (matchedGames.length === 1) {
    const id = String(matchedGames[0].id);
    const inGame = products.filter((product) => String((meta[String(product.id)] || {}).game_id || '') === id);
    if (inGame.length) return inGame;
  }

  const generic = new Set(['price','how','much','cost','the','for','is','قیمت','چند','تومان','هزینه','بازی','محصول','میشه','میباشد','چنده']);
  const scored = normalizedNames.map((entry) => ({
    product: entry.product,
    score: entry.tokens.filter((token) => !generic.has(token) && querySet.has(token)).length,
  })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score);
  if (scored.length && (scored.length === 1 || scored[0].score > scored[1].score) && (scored[0].score >= 2 || products.length === 1)) {
    return [scored[0].product];
  }
  return products;
}

export async function aiReply(env, db, userText, history = []) {
  try {
    const [products, games, meta, deals, shopName] = await Promise.all([
      getProducts(db, true),
      getGameCatalog(db),
      getProductCatalogMeta(db),
      getOtherDollarDeals(db),
      getSetting(db, 'shop_name', 'فروشگاه'),
    ]);
    const gameNames = new Map(games.map((game) => [String(game.id), String(game.name || '')]));
    const activeGameIds = new Set(games.filter((game) => game && game.active !== false).map((game) => String(game.id)));
    const catalogProducts = products.filter((product) => {
      const productMeta = meta[String(product.id)] || meta[product.id] || {};
      const gameId = String(productMeta.game_id || '');
      return !gameId || gameId === 'unassigned' || activeGameIds.has(gameId);
    });
    const list = catalogProducts.length
      ? catalogProducts.map((product) => {
          const productMeta = meta[String(product.id)] || meta[product.id] || {};
          const gameName = gameNames.get(String(productMeta.game_id || '')) || '';
          const saleLabel = String(productMeta.sale_label === undefined ? '$1' : productMeta.sale_label || '').trim();
          return '- ' + productDisplayName(product.name, gameName, ' | ') +
            (saleLabel ? ' | برچسب نمایش: ' + saleLabel : '') +
            ' | مبلغ واقعی پرداخت: ' + moneyInToman(product.price);
        }).join('\n')
      : 'در حال حاضر محصول فعالی برای فروش موجود نیست.';
    const offers = Array.isArray(deals.offers) && deals.offers.length
      ? deals.offers.map((offer) => '- ' + String(offer.title || '') +
          (offer.sale_label ? ' | برچسب: ' + String(offer.sale_label) : '') +
          (offer.description ? ' | ' + String(offer.description) : '') +
          (offer.url ? ' | پیوند: ' + String(offer.url) : '')).join('\n')
      : 'پیشنهاد دیگری در این بخش ثبت نشده است.';
    if (isTrustQuestion(userText)) {
      const base = 'برای بررسی و ارتباط، هر دو پیوند زیر در اختیار شماست:\n' +
        '🔗 ' + TRUST_LINKS[0] + '\n' +
        '🔗 ' + TRUST_LINKS[1] + '\n' +
        'اطلاعات قیمت و محصولات را هم از فهرست فعلی فروشگاه بررسی کنید.';
      return isPriceQuestion(userText) ? base + '\n\nقیمت‌های ثبت‌شدهٔ فعلی:\n' + list : base;
    }
    if (isPriceQuestion(userText)) {
      const relevant = relevantProductsForPrice(userText, catalogProducts, games, meta);
      if (!relevant.length) return 'فعلاً محصول فعالی برای فروش ثبت نشده است. لطفاً از بخش پشتیبانی بپرسید.';
      const lines = relevant.map((product) => {
        const productMeta = meta[String(product.id)] || meta[product.id] || {};
        const gameName = gameNames.get(String(productMeta.game_id || '')) || '';
        const saleLabel = String(productMeta.sale_label === undefined ? '$1' : productMeta.sale_label || '').trim();
        return '• ' + productDisplayName(product.name, gameName, ' · ') +
          (saleLabel ? ' · ' + saleLabel : '') + ' — ' + moneyInToman(product.price);
      });
      return '💰 قیمت‌های ثبت‌شدهٔ فعلی (مبلغ تومان دستی در پنل وارد می‌شود):\n' + lines.join('\n');
    }
    const priorMessages = Array.isArray(history)
      ? history.slice(-10).filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: m.content.slice(0, 1200) }))
      : [];

    const result = await env.AI.run(AI_MODEL, {
      messages: [
        {
          role: 'system',
          content:
            'تو دستیار فروشگاه «' + shopName + '» هستی. به فارسی، کوتاه و دوستانه پاسخ بده.\n' +
            'حوزهٔ پاسخ‌گویی: محصولات و بازی‌ها، برچسب فروش، قیمت، نحوهٔ خرید، اعتماد، سفارش و پشتیبانی. پاسخ تخصصی یا طولانی به موضوعات نامرتبط نده؛ کوتاه عذرخواهی کن و کاربر را به محصولات فروشگاه برگردان.\n' +
            'کاتالوگ فعال و فعلی:\n' + list + '\n' +
            'بخش خریدهای ۱ دلاری دیگر: ' + String(deals.intro || '') + '\n' +
            'پیشنهادهای ثبت‌شده در آن:\n' + offers + '\n' +
            'پیوندهای اعتماد که در صورت نیاز باید هر دو را عیناً ارائه کنی: ' + TRUST_LINKS.join(' و ') + '\n' +
            'قوانین مهم:\n' +
            '- مبلغ «تومان» در کاتالوگ، قیمت واقعی فعلی است؛ آن را دقیق و بدون تبدیل ارز بگو.\n' +
            '- برچسب نمایش (مثل $1) را از مبلغ تومان جدا نگه دار؛ نرخ تبدیل یا مبلغ تومان را حدس نزن.\n' +
            '- محصول یا قیمت ثبت‌نشده را موجود/قابل خرید معرفی نکن؛ بگو قیمت هنوز در پنل ثبت نشده است.\n' +
            '- برای سؤال دربارهٔ سفارش مشخص، کاربر را به «پیگیری سفارش» یا «پشتیبانی» هدایت کن.\n' +
            '- دربارهٔ اعتماد، هر دو پیوند اعتماد بالا را بفرست و ادعای تضمین یا اعتبار تأییدنشده نساز.',
        },
        ...priorMessages,
        { role: 'user', content: String(userText || '').slice(0, 1800) },
      ],
    });

    const answer = extractAnswer(result);
    if (answer) return answer;
    console.error('[Workers AI] Model returned no text:', AI_MODEL);
    return 'متأسفانه پاسخی دریافت نشد. لطفاً دوباره تلاش کنید یا از بخش 🎧 پشتیبانی پیام بگذارید.';
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error('[Workers AI] Request failed for ' + AI_MODEL + ':', detail.slice(0, 500));
    return UNAVAILABLE_REPLY;
  }
}
