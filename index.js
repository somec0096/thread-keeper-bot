const { Client, GatewayIntentBits, ChannelType } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});

// ---------- 定义带重试的发送函数 ----------
async function sendWithRetry(thread, retries = 3, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const sentMessage = await thread.send("\u200b");
      await sentMessage.delete();
      console.log(`  ✅ 续命成功: ${thread.name}`);
      return true;
    } catch (error) {
      if (attempt === retries) {
        console.error(
          `  ❌ 续命失败 ${thread.name} (重试${retries}次后): ${error.message}`,
        );
        return false;
      }
      console.log(
        `  ⚠️ 第${attempt}次失败，${delay / 1000}秒后重试: ${thread.name} (${error.message})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
// -----------------------------------------

client.once("ready", async () => {
  console.log(`✅ 机器人 ${client.user.tag} 已启动，开始自动处理所有论坛...`);

  // 你的服务器ID（请确认是否正确）
  const GUILD_ID = "1361734105699713137";

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.channels.fetch();

    const forumChannels = guild.channels.cache.filter(
      (channel) => channel.type === ChannelType.GuildForum,
    );

    console.log(`📢 在服务器中找到了 ${forumChannels.size} 个论坛频道。`);

    for (const forumChannel of forumChannels.values()) {
      console.log(
        `\n--- 开始处理论坛频道: ${forumChannel.name} (ID: ${forumChannel.id}) ---`,
      );

      // 获取所有活跃帖子
      const activeThreads = await forumChannel.threads.fetchActive();
      console.log(`找到 ${activeThreads.threads.size} 个活跃帖子`);

      // 获取所有归档帖子（limit: 100 表示最多获取100个，如果超过100需要分页）
      const archivedThreads = await forumChannel.threads.fetchArchived({
        limit: 100,
      });
      console.log(`找到 ${archivedThreads.threads.size} 个归档帖子`);

      // 合并处理所有帖子
      const allThreads = [
        ...activeThreads.threads.values(),
        ...archivedThreads.threads.values(),
      ];

      // 使用带重试的发送函数处理每个帖子
      for (const thread of allThreads) {
        await sendWithRetry(thread, 3, 2000); // 最多重试3次，间隔2秒
      }
    }

    console.log("\n✨ 所有论坛频道处理完毕！");
  } catch (error) {
    console.error("❌ 严重错误:", error);
  } finally {
    client.destroy();
    console.log("机器人已安全断开连接。");
  }
});

// 从环境变量读取 Token
client.login(process.env.DISCORD_TOKEN);
