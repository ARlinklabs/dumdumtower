import { message, createDataItemSigner } from "@permaweb/aoconnect";

export async function placeBet(betAmount: number) {
    if (!window.arweaveWallet) {
        throw new Error("Arweave wallet not found");
    }

    try {
        const response = await message({
            process: "al0r2Hwq9opOTqMmR7ue6hzrZ4f8wEzTsnxHF5756ng", // Update this to your actual process ID
            tags: [
                { name: "Action", value: "Transfer" },
                { name: "Quantity", value: betAmount.toString() },
                { name: "Recipient", value: "i4JjTOGaNtO7Lo5l3i7m-0cjyZWpsK9ELxOqZkE9RlA" },
               
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
