import dotenv from 'dotenv';
dotenv.config();
import { Telegraf } from 'telegraf';
import axios from 'axios';

// Initialize bot with token from environment variable
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Define the networks and their pair IDs
const networks = [
  {
    name: 'Base',
    chainId: 'base',
    pairId: '0xe428beea229e96664b0e1ec20ffb619e818b390c',
  },
];

// Function to fetch price data and send it to the group
const fetchAndUpdate = async () => {
  try {
    // URL for fetching price data
    const url = `https://api.dexscreener.com/latest/dex/pairs/base/0xe428beea229e96664b0e1ec20ffb619e818b390c`;

    // Send a GET request to the API
    const response = await axios.get(url);

    // If response is not JSON, log an error
    if (
      !response.headers['content-type'] ||
      !response.headers['content-type'].includes('application/json')
    ) {
      console.error('Received non-JSON response:', response.data);
      return;
    }

    // Extract the necessary data from the response
    const rwaData = response.data.pair;
    const {
      priceNative,
      priceUsd,
      volume,
      priceChange,
      liquidity,
      fdv,
      marketCap,
      pairCreatedAt,
      info,
    } = rwaData;

    // Prepare the message
    const message = `
📊 **RWA Price Update**
- 💰 **Price (Native):** ${priceNative}
- 💵 **Price (USD):** $${priceUsd}
- 📈 **Volume (24h):** $${volume.h24}
- 🔄 **Price Change (24h):** ${priceChange.h24}%
- 💧 **Liquidity (USD):** $${liquidity.usd}
- 🌟 **FDV:** $${fdv}
- 🌍 **Market Cap:** $${marketCap}
- 📅 **Pair Created At:** ${new Date(pairCreatedAt).toLocaleString()}
- 🖼️ **Chart:** [View Chart](${info.openGraph})
- 🧾 [View TX](https://basescan.org/tx/0x222d885b16d60d94c170097b47be9d7917de3fc02c717fef03aefeb4917697c3)
- 🔗 **RWA on CMC:** [CoinMarketCap](https://coinmarketcap.com/currencies/rwa-inc/)
    `;

    // Send the message to the group
    await bot.telegram.sendMessage(process.env.TELEGRAM_GROUP_ID, message, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
};

// Send updates every 40 seconds
setInterval(fetchAndUpdate, 40000);

// /stake command handler
bot.command('stake', async (ctx) => {
  const stakeMessage = `
💼 **Stake RWA Tokens:**
- 🚀 **RWA Inc. Launchpad:** [Stake here](https://example.com/launchpad)
- 🌊 **Thena Pool:** [Stake here](https://example.com/thena-pool)
  `;
  await ctx.reply(stakeMessage, { parse_mode: 'Markdown' });
});

// Launch the bot
bot.launch().then(() => console.log('Bot is running...'));