import { SSCConfig } from '../../config/ssc';
import axios from 'axios';
import cheerio from 'cheerio';

export async function scrapeSSC() {
  const res = await axios.get(SSCConfig.url);
  const $ = cheerio.load(res.data);

  const photoText = $(SSCConfig.selectors.photo).text().trim();
  const signatureText = $(SSCConfig.selectors.signature).text().trim();

  return [
    {
      type: 'Photo',
      format: SSCConfig.expected.format,
      maxSizeKB: SSCConfig.expected.maxSizeKB,
      dimensions: SSCConfig.expected.dimensions,
      namingConvention: 'photo.jpg',
      raw: photoText,
    },
    {
      type: 'Signature',
      format: SSCConfig.expected.format,
      maxSizeKB: SSCConfig.expected.maxSizeKB,
      dimensions: SSCConfig.expected.dimensions,
      namingConvention: 'signature.jpg',
      raw: signatureText,
    },
  ];
}
