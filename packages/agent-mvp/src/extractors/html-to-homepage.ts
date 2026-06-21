import * as cheerio from 'cheerio';
import { convert } from 'html-to-text';
import { homepageProfileSchema, type HomepageProfile } from '../schemas/index.js';

export interface HtmlToHomepageInput {
  productName: string;
  sourceFile: string;
  html: string;
}

const callToActionPattern =
  /(start|try|get|download|sign|contact|book|learn|docs|api|开始|体验|试用|下载|注册|登录|联系|预约|了解|文档|控制台|立即)/i;

const productClaimPattern =
  /(ai|model|assistant|agent|api|developer|enterprise|reasoning|智能|模型|助手|智能体|开发者|企业|推理|多模态|效率|安全|开放|开源)/i;

const targetUserPattern =
  /(developer|enterprise|team|business|researcher|student|creator|开发者|企业|团队|研究|学生|创作者|产品经理|用户)/i;

const trustSignalPattern =
  /(security|safe|privacy|compliance|customer|partner|case|soc|iso|安全|隐私|合规|客户|伙伴|案例|可靠|可信)/i;

const developerSignalPattern =
  /(api|docs|sdk|console|playground|developer|github|文档|接口|控制台|开发者|代码|开源|平台)/i;

const pricingSignalPattern =
  /(pricing|price|plan|free|paid|billing|token|价格|定价|套餐|免费|付费|计费)/i;

export function extractHomepageProfile(
  input: HtmlToHomepageInput,
): HomepageProfile {
  const $ = cheerio.load(input.html);

  $('script, style, noscript, svg').remove();

  const title = normalizeText($('title').first().text());
  const metaDescription = normalizeText(
    $('meta[name="description"]').attr('content') ??
      $('meta[property="og:description"]').attr('content') ??
      '',
  );
  const headings = collectTexts($, 'h1, h2, h3', 30);
  const navigationItems = collectTexts($, 'nav a, header a', 30);
  const interactiveTexts = collectTexts($, 'button, a', 80);
  const callToActions = interactiveTexts
    .filter((text) => callToActionPattern.test(text))
    .slice(0, 20);
  const bodyText = convert($.html(), {
    wordwrap: false,
    selectors: [
      { selector: 'a', options: { ignoreHref: true } },
      { selector: 'img', format: 'skip' },
    ],
  });
  const textLines = uniqueTexts(
    bodyText
      .split('\n')
      .map(normalizeText)
      .filter((text) => text.length >= 8),
  );

  const heroMessages = headings.length > 0 ? headings.slice(0, 5) : textLines.slice(0, 6);
  const profile: HomepageProfile = {
    productName: input.productName,
    sourceFile: input.sourceFile,
    title,
    metaDescription,
    headings,
    heroMessages,
    navigationItems,
    callToActions: uniqueTexts(callToActions),
    productClaims: pickByPattern(textLines, productClaimPattern, 25),
    targetUsers: pickByPattern(textLines, targetUserPattern, 15),
    trustSignals: pickByPattern(textLines, trustSignalPattern, 15),
    developerSignals: pickByPattern(textLines, developerSignalPattern, 15),
    pricingSignals: pickByPattern(textLines, pricingSignalPattern, 15),
    rawTextPreview: textLines.slice(0, 80).join('\n').slice(0, 8000),
  };

  return homepageProfileSchema.parse(profile);
}

function collectTexts(
  $: cheerio.CheerioAPI,
  selector: string,
  limit: number,
): string[] {
  const values: string[] = [];

  $(selector).each((_, element) => {
    const text = normalizeText($(element).text());

    if (text.length > 0) {
      values.push(text);
    }
  });

  return uniqueTexts(values).slice(0, limit);
}

function pickByPattern(
  values: string[],
  pattern: RegExp,
  limit: number,
): string[] {
  return values.filter((value) => pattern.test(value)).slice(0, limit);
}

function uniqueTexts(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeText(value);
    const key = normalized.toLowerCase();

    if (normalized.length === 0 || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
