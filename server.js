import dotenv from 'dotenv';
dotenv.config();
import { Telegraf, Markup } from 'telegraf';
import axios from 'axios';

// Validate environment variables
const requiredEnvVars = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_GROUP_ID'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Error: Missing ${varName} in environment variables.`);
    process.exit(1);
  }
});

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Function to delete any existing webhook
const initializeBot = async () => {
  try {
    await bot.startWebhook({
      url: 'https://tg-bot-y1pe.onrender.com',
      webhookHandler: (req, res) => {
        bot.handleUpdate(req.body, res);
      },
    });
    console.log('Webhook set up successfully...');
  } catch (error) {
    console.error('Error setting up webhook:', error.message);
  }
};

// Function to fetch gainers and losers from CoinGecko
const fetchAndUpdate = async () => {
  try {
    console.log('Fetching top gainers and losers from CoinGecko...');
    const url = 'https://api.coingecko.com/api/v3/coins/markets';
    const response = await axios.get(url, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 250, // Max number of coins per page
        page: 1,
        price_change_percentage: '24h',
      },
    });

    if (!response.data || response.data.length === 0) {
      console.error('Error: No data received from CoinGecko.');
      return;
    }

    // Sort by price change percentage (24h)
    const sortedCoins = [...response.data].sort(
      (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h
    );

    // Top 10 gainers
    const topGainers = sortedCoins.slice(0, 10).map((coin, index) => {
      return `${index + 1}. **${
        coin.name
      }** (${coin.symbol.toUpperCase()})\n   🟢 **+${coin.price_change_percentage_24h.toFixed(
        2
      )}%** ↑ - $${coin.current_price}`;
    });

    // Top 10 losers
    const topLosers = sortedCoins
      .slice(-10)
      .reverse()
      .map((coin, index) => {
        return `${index + 1}. **${
          coin.name
        }** (${coin.symbol.toUpperCase()})\n   🔴 **${coin.price_change_percentage_24h.toFixed(
          2
        )}%** ↓ - $${coin.current_price}`;
      });

    // Send gainers to Telegram
    const gainersMessage = `
📈 **Top 10 Gagnants (24h):**
${topGainers.join('\n\n')}
    `;
    console.log('Sending gainers message to Telegram group...');
    await bot.telegram.sendMessage(
      process.env.TELEGRAM_GROUP_ID,
      gainersMessage,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.url(
            'Voir le graphique complet',
            'https://www.coingecko.com/fr/coins/trending'
          ),
        ]),
      }
    );
    console.log('Gainers message sent successfully.');

    // Send losers to Telegram
    const losersMessage = `
📉 **Top 10 Perdants (24h):**
${topLosers.join('\n\n')}
    `;
    console.log('Sending losers message to Telegram group...');
    await bot.telegram.sendMessage(
      process.env.TELEGRAM_GROUP_ID,
      losersMessage,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.url(
            'Voir le graphique complet',
            'https://www.coingecko.com/fr/coins/trending'
          ),
        ]),
      }
    );
    console.log('Losers message sent successfully.');
  } catch (error) {
    console.error('Error fetching data from CoinGecko:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

// Update every 10 minutes
setInterval(fetchAndUpdate, 600000);

// Launch the bot
initializeBot()
  .then(() => {
    console.log('Bot is running...');
  })
  .catch((err) => {
    console.error('Error initializing bot:', err.message);
    process.exit(1);
  });

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
