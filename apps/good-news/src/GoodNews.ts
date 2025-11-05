import dayjs from "dayjs";
import * as consts from "./consts";
import * as utils from "@platform/utils";
import {
  GoodNewsInterface,
  GoodNewsArticle,
  GoodNewsHeadline,
  GoodNewsSummary,
  GoodNewsUrlMap,
  GoodNewsH3,
  GoodNewsPeriod,
} from "./types/GoodNews";
import Ollama, { OllamaClient } from "@platform/ollama";

export default class GoodNews implements GoodNewsInterface {
  lastAcceptableDate: Date;
  ollamaClient: OllamaClient;

  constructor(period: GoodNewsPeriod, ollamaClient: OllamaClient) {
    this.ollamaClient = ollamaClient;
    const today = new Date();
    this.lastAcceptableDate = new Date();
    this.lastAcceptableDate.setDate(today.getDate() - period);
  }

  static async create(period: GoodNewsPeriod) {
    const ollamaClient = await Ollama.create(consts.OLLAMA_MODEL);

    return new GoodNews(period, ollamaClient);
  }

  private async writeSummary(data: GoodNewsSummary[]): Promise<void> {
    data.sort((a, b) => b.score - a.score);
    const now = dayjs();
    const year = now.format("YYYY");
    const today = now.format("MMMMD");
    const lastPeriod = dayjs(this.lastAcceptableDate).format("MMMMD");
    const periodDir = `${lastPeriod}_${today}`;
    const dataDir = `${utils.getDirname(
      import.meta.url
    )}/data/${year}/${periodDir}`;
    await utils.createDirectoriesSync(dataDir);
    for (const summary of data) {
      const subjectFile = `${dataDir}/${summary.article.headline.source}.txt`;
      const allFile = `${dataDir}/all.txt`;
      await utils.appendFileSync(subjectFile, JSON.stringify(summary, null, 2));
      await utils.appendFileSync(allFile, JSON.stringify(summary, null, 2));
    }
  }

  async fetchHeadlines(pageUrls: GoodNewsUrlMap): Promise<GoodNewsHeadline[]> {
    const headlineTitles: Set<string> = new Set();
    const headlines: GoodNewsHeadline[] = [];

    for (const [source, headlineUrl] of Object.entries(pageUrls)) {
      for (const headline of await this.fetchHeadlinesFromPage(headlineUrl)) {
        if (!headlineTitles.has(headline.title)) {
          headline.source = source;
          headlines.push(headline);
        }
        headlineTitles.add(headline.title);
      }
    }

    return headlines;
  }

  async fetchHeadlinesFromPage(url: string): Promise<GoodNewsHeadline[]> {
    const $ = await utils.fetchUrlToCheerio(url);

    const headlines: GoodNewsHeadline[] = [];

    $(".td_module_3").each((_, element) => {
      const data = $(element).find("h3 a").attr() as unknown as GoodNewsH3;
      const dateText = $(element).find(".td-post-date").text().trim();
      const date = new Date(dateText);
      if (date >= this.lastAcceptableDate) {
        headlines.push({
          dateString: date.toDateString(),
          date,
          rel: data.rel,
          href: data.href,
          title: data.title,
        });
      }
    });

    return headlines;
  }

  async fetchArticleText(headline: GoodNewsHeadline): Promise<GoodNewsArticle> {
    const $ = await utils.fetchUrlToCheerio(headline.href);

    const postText = $("div.td-post-content").text();
    let postTextArr = postText.split("\n");
    postTextArr = postTextArr.map((text) => text.trim());
    postTextArr = postTextArr.filter((str) => str !== "");
    const filteredText = postTextArr.join(" ");

    return {
      headline: headline,
      content: filteredText,
    };
  }

  async generateSummary(article: GoodNewsArticle): Promise<GoodNewsSummary> {
    const res = await this.ollamaClient.generate(
      `${article.headline.title} ${article.content}`
    );

    const score = Number(res.response);

    return {
      article: article,
      score,
    };
  }

  async fetchTopStories() {
    const headlines: GoodNewsHeadline[] = await this.fetchHeadlines(
      consts.HEADLINE_TYPES
    );

    const articles: GoodNewsArticle[] = [];
    for (const headline of headlines) {
      articles.push(await this.fetchArticleText(headline));
    }

    const summaries: GoodNewsSummary[] = [];
    for (const article of articles) {
      const summary = await this.generateSummary(article);
      if (summary.score > 6) {
        summaries.push(summary);
      }
    }

    await this.writeSummary(summaries);
  }
}

async function main() {
  const news = await GoodNews.create(GoodNewsPeriod.WEEK);
  news.fetchTopStories();
}

main();
