import dotenv from 'dotenv';
dotenv.config();
import { Telegraf } from 'telegraf';
import axios from 'axios';

// Validate environment variables
const requiredEnvVars = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_GROUP_ID'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`Error: Missing ${varName} in environment variables.`);
    process.exit(1);
  }
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Function to fetch price data and send it to the group
const fetchAndUpdate = async () => {
  try {
    console.log('Fetching price data...');

    const url = `https://api.dexscreener.com/latest/dex/pairs/base/0xe428beea229e96664b0e1ec20ffb619e818b390c`;
    console.log(`API URL: ${url}`);

    // Send a GET request to the API
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    console.log('API response received.');

    if (!response.data || !response.data.pair) {
      console.error('Error: Missing expected data in API response.');
      return;
    }

    const rwaData = response.data.pair;
    console.log('Data extracted from API response:', rwaData);

    const {
      priceNative = 'N/A',
      priceUsd = 'N/A',
      volume = {},
      priceChange = {},
      liquidity = {},
      fdv = 'N/A',
      marketCap = 'N/A',
      pairCreatedAt = 'N/A',
      info = {},
    } = rwaData;

    // Prepare the message
    const message = `
📊 **RWA Price Update**
- 💰 **Price (Native):** ${priceNative}
- 💵 **Price (USD):** $${priceUsd}
- 📈 **Volume (24h):** $${volume.h24 || 'N/A'}
- 🔄 **Price Change (24h):** ${priceChange.h24 || 'N/A'}%
- 💧 **Liquidity (USD):** $${liquidity.usd || 'N/A'}
- 🌟 **FDV:** $${fdv}
- 🌍 **Market Cap:** $${marketCap}
- 📅 **Pair Created At:** ${
      pairCreatedAt !== 'N/A' ? new Date(pairCreatedAt).toLocaleString() : 'N/A'
    }
- 🖼️ **Chart:** [View Chart](${info.openGraph || '#'})
- 🧾 [View TX](https://basescan.org/tx/0x222d885b16d60d94c170097b47be9d7917de3fc02c717fef03aefeb4917697c3)
- 🔗 **RWA on CMC:** [CoinMarketCap](https://coinmarketcap.com/currencies/rwa-inc/)
    `;

    console.log('Sending message to Telegram group...');
    await bot.telegram.sendMessage(process.env.TELEGRAM_GROUP_ID, message, {
      parse_mode: 'Markdown',
    });
    console.log('Message sent successfully.');
  } catch (error) {
    console.error('Error fetching data:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

// Periodic updates
setInterval(fetchAndUpdate, 40000);

// /stake command handler
bot.command('stake', async (ctx) => {
  console.log('Received /stake command.');
  const stakeMessage = `
💼 **Stake RWA Tokens:**
- 🚀 **RWA Inc. Launchpad:** [Stake here](https://example.com/launchpad)
- 🌊 **Thena Pool:** [Stake here](https://example.com/thena-pool)
  `;
  await ctx.reply(stakeMessage, { parse_mode: 'Markdown' });
  console.log('Stake message sent successfully.');
});

// Launch the bot
bot
  .launch()
  .then(() => console.log('Bot is running...'))
  .catch((err) => {
    console.error('Error launching bot:', err.message);
    process.exit(1);
  });

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
