import { GoodNewsUrlMap } from "./types/GoodNews";

const GOOD_NEWS_URL = "https://www.goodnewsnetwork.org/category/news";

export const HEADLINE_TYPES: GoodNewsUrlMap = {
  usa: `${GOOD_NEWS_URL}/usa`,
  world: `${GOOD_NEWS_URL}/world`,
  inspiring: `${GOOD_NEWS_URL}/inspiring`,
  heroes: `${GOOD_NEWS_URL}/heroes`,
  science: `${GOOD_NEWS_URL}/science`,
  business: `${GOOD_NEWS_URL}/business`,
};

export const OLLAMA_MODEL = "GoodNewsLLama:v0.0.3";
