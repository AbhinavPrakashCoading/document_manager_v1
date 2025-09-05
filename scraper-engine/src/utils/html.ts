import axios from 'axios';
import cheerio from 'cheerio';

export async function fetchHTML(url: string): Promise<string> {
  const { data } = await axios.get(url);
  return data;
}

export function extractText(html: string, selector: string): string {
  const $ = cheerio.load(html);
  return $(selector).text().trim();
}