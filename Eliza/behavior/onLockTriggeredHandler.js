// eliza/behavior/onLockTriggeredHandler.js

/**
 * Handler triggered when a lock event occurs.
 * This behavior should notify the user and optionally provide guidance or resources.
 */

module.exports = async function onLockTriggeredHandler(
  { lockState, userAddress },
  { eliza }
) {
  try {
    const { isLocked, cooldownEndsAt, reason } = lockState;

    // Compose an appropriate message
    let message = `🚨 Lock triggered for address: ${userAddress}\n\n`;
    message += isLocked
      ? `🛑 Your account is now locked until ${new Date(
          cooldownEndsAt
        ).toLocaleString()}.\n`
      : `✅ Your account is no longer locked.\n`;
    if (reason) message += `🔍 Reason: ${reason}\n`;

    // Suggest behavioral support or next steps
    if (isLocked) {
      message += `\n💡 Take this time to reflect or review your recent trades. Want help understanding your behavior? Just say "yes".`;
    } else {
      message += `\n🎉 You're back online! Stay sharp and trade responsibly.`;
    }

    // Send message through Eliza agent
    await eliza.sendMessageToUser(userAddress, message);

    // Optionally, you can set Eliza to await a response and offer further guidance
    if (isLocked) {
      await eliza.expectUserResponse(userAddress, {
        expectedInputs: ["yes", "no"],
        onYes: async () => {
          await eliza.sendMessageToUser(
            userAddress,
            "👍 Okay, let's explore what led to the lock. We'll walk through your recent trades and talk about healthier habits."
          );
        },
        onNo: async () => {
          await eliza.sendMessageToUser(
            userAddress,
            "✅ Got it. If you change your mind, just type 'help'."
          );
        },
      });
    }
  } catch (error) {
    console.error("❌ Error in onLockTriggeredHandler:", error);
  }
};
