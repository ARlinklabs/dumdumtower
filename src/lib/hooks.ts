import { message, createDataItemSigner ,result } from "@permaweb/aoconnect";

export async function placeBet(betAmount: number) {
    if (!window.arweaveWallet) {
        throw new Error("Arweave wallet not found");
    }

    try {
        const response = await message({
            process: "al0r2Hwq9opOTqMmR7ue6hzrZ4f8wEzTsnxHF5756ng", 
            tags: [
                { name: "Action", value: "Transfer" },
                { name: "Quantity", value: betAmount.toString() },
                { name: "Recipient", value: "al0r2Hwq9opOTqMmR7ue6hzrZ4f8wEzTsnxHF5756ng" },
               
            ],
           

            signer: createDataItemSigner(window.arweaveWallet),
            data: "",
        });
        console.log("Bet placed successfully:", response);
        return response;
    } catch (error) {
        console.error("Error placing bet:", error);
        throw error;
    }
}
export const verifyAndClaimWinnings = async (betAmount: number, multiplier: number, gridState: string) => {
    try {
      const response = await message({
        process: 'al0r2Hwq9opOTqMmR7ue6hzrZ4f8wEzTsnxHF5756ng',
        tags: [
          { name: 'Action', value: 'Claim-Winnings' },
          { name: 'BetAmount', value: betAmount.toString() },
          { name: 'Multiplier', value: multiplier.toString() },
          { name: 'GridState', value: gridState }
        ],
        signer: createDataItemSigner(window.arweaveWallet),
      });
  
      const { Messages } = await result({
        message: response,
        process: 'al0r2Hwq9opOTqMmR7ue6hzrZ4f8wEzTsnxHF5756ng',
      });
      console.log("Messages:", Messages);    
  
      if (Array.isArray(Messages) && Messages.length > 0) {
        const winningsSentMessage = Messages.find(msg => 
          msg.Tags.some((tag: { name: string; value: string }) => tag.name === 'Action' && tag.value === 'Winnings-Sent')
        );
  
        if (winningsSentMessage) {
          const amountTag = winningsSentMessage.Tags.find((tag: { name: string; value: string })  => tag.name === 'Amount');
          if (amountTag) {
            return parseFloat(amountTag.value);
          }
        }
  
        const invalidClaimMessage = Messages.find(msg => 
          msg.Tags.some((tag: { name: string; value: string }) => tag.name === 'Action' && tag.value === 'Invalid-Claim')
        );
  
        if (invalidClaimMessage) {
          const messageTag = invalidClaimMessage.Tags.find((tag: { name: string; value: string }) => tag.name === 'Message');
          throw new Error(messageTag ? messageTag.value : 'Invalid claim');
        }
      }
  
      throw new Error('Unexpected response from contract');
    } catch (error) {
      console.error('Error verifying and claiming winnings:', error);
      throw error;
    }
  };