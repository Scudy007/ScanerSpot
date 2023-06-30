const puppeteer = require("puppeteer");
const bybitUrls = ['https://cryptowat.ch/ru-RU/markets?types=spot&exchanges=bybit'];
const huobiUrls = ['https://cryptowat.ch/ru-RU/markets?types=spot&exchanges=huobi'];
const targetElements = [
  '.styles_td__IrKBs',
  '.styles_td__IrKBs.styles_rightAlign__kEGFQ',
];

function findCommonAssets(data1, exchangeName1, data2, exchangeName2) {
  const excludedValues = [
    'Symbol', 'Тип', 'Цена', 'Изменить %', 'USD Объем', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '%', '-', '+'
  ];
  const percentageRegex = /^\d+(\.\d+)?%$/;

  const assetNames1 = data1.filter((item, index) => index % 2 === 0 && !excludedValues.includes(item));
  const assetPrices1 = data1.filter((item, index) => index % 2 !== 0 && !excludedValues.includes(item));
  const assetNames2 = data2.filter((item, index) => index % 2 === 0 && !excludedValues.includes(item));
  const assetPrices2 = data2.filter((item, index) => index % 2 !== 0 && !excludedValues.includes(item));
  const commonAssets = assetNames1.filter((asset) =>
    assetNames2.includes(asset) &&
    asset !== '' &&
    !percentageRegex.test(asset) &&
    isNaN(asset) &&
    asset.length > 4 &&
    !asset.includes('%')
  );

  console.log('Common Assets:');
  commonAssets.forEach((asset) => {
    const index1 = assetNames1.indexOf(asset);
    const index2 = assetNames2.indexOf(asset);
    console.log(`Asset: ${asset}`);
    console.log(`Exchange 1: ${exchangeName1}`);
    console.log(`Price at Exchange 1: ${assetPrices1[index1]}`);
    console.log(`Exchange 2: ${exchangeName2}`);
    console.log(`Price at Exchange 2: ${assetPrices2[index2]}`);
    


    const price1String = String(assetPrices1[index1]).replace(/\s/g, '').replace(',', '.');
    const price2String = String(assetPrices2[index2]).replace(/\s/g, '').replace(',', '.');
      const maxStringLength = Math.max(price1String.length, price2String.length)
      const prices = [assetPrices1[index1], assetPrices2[index2]]
      const formattedString1 = price1String.padEnd(maxStringLength, '0');
      const formattedString2 = price2String.padEnd(maxStringLength, '0');
      const priceFloat1 = parseFloat(formattedString1);
      const priceFloat2 = parseFloat(formattedString2);
      const minPrice = Math.min(priceFloat1, priceFloat2);
      const maxPrice = Math.max(priceFloat1, priceFloat2);
      const profitPercentage = ((maxPrice - minPrice) / minPrice) * 100;

      console.log(`Profit Percentage: ${profitPercentage}%`);
      console.log('---------------------------');
    });

}

async function run() {
  const bybitBrowser = await puppeteer.launch({ headless: true });
  const bybitPage = await bybitBrowser.newPage();
  const huobiBrowser = await puppeteer.launch({ headless: true });
  const huobiPage = await huobiBrowser.newPage();
  let bybitData = [];
  let huobiData = [];
  let bybitPageNumber = 1;
  let huobiPageNumber = 1;

  setInterval(async () => {
    try {
      console.log('Fetching bybit data...');
      const currentPageUrl = `${bybitUrls[0]}&page=${bybitPageNumber}`;
      await bybitPage.goto(currentPageUrl, { timeout: 0 });
      bybitData = await bybitPage.$$eval(targetElements.join(','), (elements) => {
        return elements.map((element) => element.textContent.trim());
      });

      const nextButton = await bybitPage.$('div.inline-block a.styles_item__GFNkj[rel="next"]');
      if (nextButton) {
        bybitPageNumber++;
        if (bybitPageNumber > 5) {
          bybitPageNumber = 1;
        }
        await nextButton.click();
      } else {
        console.log('Next button not found. Returning to the first page...');
        bybitPageNumber = 1;
        await bybitPage.goto(bybitUrls[0], { timeout: 60000 });
      }

      findCommonAssets(
        bybitData,
        'bybit',
        huobiData,
        'huobi',
      );
    } catch (error) {
      console.error('Error fetching okx data:', error);
    }
  }, 60000);

  setInterval(async () => {
    try {
      console.log('Fetching huobi data...');
      const currentPageUrl = `${huobiUrls[0]}&page=${huobiPageNumber}`;
      await huobiPage.goto(currentPageUrl, { timeout: 0 });
      huobiData = await huobiPage.$$eval(targetElements.join(','), (elements) => {
        return elements.map((element) => element.textContent.trim());
      });

      const nextButton = await huobiPage.$('div.inline-block a.styles_item__GFNkj[rel="next"]');
      if (nextButton) {
        huobiPageNumber++;
        if (huobiPageNumber > 5) {
          huobiPageNumber = 1;
        }
        await nextButton.click();
      } else {
        console.log('Next button not found. Returning to the first page...');
        huobiPageNumber = 1;
        await huobiPage.goto(huobiUrls[0], { timeout: 60000 });
      }

      findCommonAssets(
        bybitData,
        'bybit',
        huobiData,
        'huobi',
      );
    } catch (error) {
      console.error('Error fetching huobi data:', error);
    }
  }, 60000);

  setInterval(() => {
    findCommonAssets(
      bybitData,
        'bybit',
        huobiData,
        'huobi',
    );
  }, 60000);
}

run();
